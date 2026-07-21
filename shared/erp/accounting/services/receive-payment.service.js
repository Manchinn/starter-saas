const { ReceivePayment, ReceivePaymentInvoice, Invoice, Customer } = require('../../../../server/models')
const { Op } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { getNext } = require('../../settings/services/sequence.service')

const customerAttrs = ['id', 'name', 'company', 'email', 'phone']
const invoiceAttrs  = ['id', 'invoiceNumber', 'invoiceDate', 'dueDate', 'total', 'amountPaid', 'status']

const lineInclude = {
  model: ReceivePaymentInvoice,
  as: 'lines',
  include: [{ model: Invoice, as: 'invoice', attributes: invoiceAttrs }],
}

const nextRefNo = (userId) => getNext('RCP', userId)

const round2 = (v) => Math.round(Number(v || 0) * 100) / 100

const list = async ({ page = 1, limit = 20, search = '', status = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where  = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (search) where[Op.or] = [{ refNo: { [Op.like]: `%${search}%` } }, { reference: { [Op.like]: `%${search}%` } }]
  if (status) where.status = status

  const { count, rows } = await ReceivePayment.findAndCountAll({
    where, limit, offset,
    order: [['createdAt', 'DESC']],
    include: [{ model: Customer, as: 'customer', attributes: customerAttrs }],
    distinct: true,
  })
  return { total: count, page, limit, receivePayments: rows }
}

const getById = async (id) => {
  const rp = await ReceivePayment.findByPk(id, {
    include: [
      lineInclude,
      { model: Customer, as: 'customer', attributes: customerAttrs },
    ],
  })
  if (!rp) throw { status: 404, message: 'Receive Payment not found' }
  return rp
}

// Outstanding invoices for a customer: status='sent' AND balanceDue > 0.
// Excludes invoices already allocated against draft/confirmed receive payments
// for the full balance — partial allocations stay selectable.
const availableInvoices = async ({ customerId, organizationId }) => {
  const where = {
    customerId,
    organizationId: organizationId || null,
    status: { [Op.in]: ['sent'] },
    dataFlag: { [Op.ne]: 2 },
  }
  const invoices = await Invoice.findAll({ where, order: [['invoiceDate', 'DESC']], attributes: invoiceAttrs })
  return invoices.filter(inv => Number(inv.balanceDue) > 0)
}

// Allocations: [{ invoiceId, amount }] — amount is optional; if omitted we
// auto-allocate up to the invoice's remaining balanceDue.
const create = async ({ date, customerId, paymentMethod, reference, notes, currency, exchangeRate, allocations, invoiceIds = [], userId, organizationId }) => {
  if (!customerId)    throw { status: 400, message: 'Customer is required' }
  if (!date)          throw { status: 400, message: 'Date is required' }
  if (!paymentMethod) throw { status: 400, message: 'Payment method is required' }

  // Normalize allocations: prefer explicit list; fall back to legacy invoiceIds
  // (full-balance allocation per invoice).
  const allocs = Array.isArray(allocations) && allocations.length
    ? allocations.map(a => ({ invoiceId: a.invoiceId, amount: a.amount != null ? Number(a.amount) : null }))
    : (invoiceIds || []).map(id => ({ invoiceId: id, amount: null }))
  if (!allocs.length) throw { status: 400, message: 'Select at least one invoice' }

  const customer = await Customer.findByPk(customerId)
  if (!customer) throw { status: 400, message: 'Customer not found' }

  const invoiceIdSet = [...new Set(allocs.map(a => a.invoiceId))]
  const invoices = await Invoice.findAll({
    where: { id: { [Op.in]: invoiceIdSet }, customerId, organizationId: organizationId || null },
  })
  if (invoices.length !== invoiceIdSet.length)
    throw { status: 400, message: 'One or more invoices not found or do not belong to this customer' }

  const invMap = new Map(invoices.map(inv => [inv.id, inv]))
  let total = 0
  for (const a of allocs) {
    const inv = invMap.get(a.invoiceId)
    const balance = Number(inv.balanceDue)
    const amount  = a.amount == null ? balance : round2(a.amount)
    if (amount <= 0) throw { status: 400, message: `Allocation for invoice ${inv.invoiceNumber} must be greater than 0` }
    if (amount > balance + 0.001) {
      throw { status: 400, message: `Allocation for invoice ${inv.invoiceNumber} (${amount}) exceeds outstanding balance (${balance})` }
    }
    a.amount = amount
    total += amount
  }
  total = round2(total)

  const fx = await require('../../settings/services/currency.service').getRateOn(currency, date, organizationId)
  const resolvedRate = exchangeRate != null && Number(exchangeRate) > 0 ? Number(exchangeRate) : fx
  const refNo = await nextRefNo(userId)

  return sequelize.transaction(async (t) => {
    const rp = await ReceivePayment.create({
      refNo, date, customerId, paymentMethod,
      reference: reference || null,
      notes: notes || null,
      amount: total,
      currency: currency || null,
      exchangeRate: resolvedRate,
      organizationId: organizationId || null,
      createdBy: userId || null, modifiedBy: userId || null,
    }, { transaction: t })

    for (const a of allocs) {
      await ReceivePaymentInvoice.create({
        receivePaymentId: rp.id,
        invoiceId:        a.invoiceId,
        amount:           a.amount,
        organizationId:   organizationId || null,
      }, { transaction: t })
    }
    return getById(rp.id)
  })
}

// Apply / undo per-invoice allocation effects. Pulled out so confirm + cancel
// share the same balance-math (and stay in sync if it changes).
const applyAllocations = async (lines, direction /* +1 apply, -1 undo */) => {
  for (const line of lines) {
    const inv = await Invoice.findByPk(line.invoiceId)
    if (!inv) continue
    const delta = direction * Number(line.amount)
    const newPaid = round2(Math.max(0, Number(inv.amountPaid || 0) + delta))
    const isFullySettled = newPaid + 0.001 >= Number(inv.total)
    await inv.update({
      amountPaid: newPaid,
      status:     isFullySettled ? 'paid' : (direction < 0 ? 'sent' : inv.status),
    })
  }
}

const confirm = async (id, userId) => {
  const rp = await ReceivePayment.findByPk(id, { include: [lineInclude] })
  if (!rp)                   throw { status: 404, message: 'Receive Payment not found' }
  if (rp.status !== 'draft') throw { status: 400, message: 'Only draft payments can be confirmed' }
  await require('./tax-period.service').assertOpen(rp.date, rp.organizationId)

  const previousStatus = rp.status
  await rp.update({ status: 'confirmed', modifiedBy: userId || null })

  try {
    await applyAllocations(rp.lines, +1)
    await require('./auto-journal.service').postReceivePayment(await getById(id), userId)
  } catch (err) {
    // Best-effort revert: undo any allocations we managed to apply, then flip status back.
    try { await applyAllocations(rp.lines, -1) } catch (_) { /* swallow — primary error wins */ }
    await rp.update({ status: previousStatus })
    throw err
  }
  const confirmed = await getById(id)
  // Customer notify after ERP confirm work. Default no-op until a channel adapter registers.
  try {
    const { notifyCustomer } = require('../../notifications/customer-notify')
    await notifyCustomer({
      organizationId: confirmed.organizationId,
      customerId: confirmed.customerId,
      text: `Payment ${confirmed.refNo} has been received.`,
    })
  } catch (_) { /* Customer notify is best-effort */ }
  return confirmed
}

// Cancel works in two modes:
//   draft     → just flip to cancelled (no GL impact)
//   confirmed → reverse the GL journal, undo amountPaid on each linked invoice
const cancel = async (id, userId) => {
  const rp = await ReceivePayment.findByPk(id, { include: [lineInclude] })
  if (!rp)                       throw { status: 404, message: 'Receive Payment not found' }
  if (rp.status === 'cancelled') throw { status: 400, message: 'Receive Payment is already cancelled' }
  if (rp.status === 'confirmed') {
    await require('./tax-period.service').assertOpen(rp.date, rp.organizationId)
  }

  const previousStatus = rp.status
  await rp.update({ status: 'cancelled', modifiedBy: userId || null })

  if (previousStatus === 'confirmed') {
    try {
      await applyAllocations(rp.lines, -1)
      await require('./auto-journal.service').reverseReceivePayment(rp, userId, `receive payment cancelled from "${previousStatus}"`)
    } catch (err) {
      try { await applyAllocations(rp.lines, +1) } catch (_) {}
      await rp.update({ status: previousStatus })
      throw err
    }
  }
  return getById(id)
}

const remove = async (id) => {
  const rp = await ReceivePayment.findByPk(id)
  if (!rp)                   throw { status: 404, message: 'Receive Payment not found' }
  if (rp.status !== 'draft') throw { status: 400, message: 'Only draft payments can be deleted' }
  await rp.destroy()
}

module.exports = { list, getById, availableInvoices, create, confirm, cancel, remove }
