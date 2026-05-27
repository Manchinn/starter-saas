const { CreditNote, Invoice, Customer } = require('../../../../server/models')
const { Op } = require('sequelize')
const { getNext } = require('../../settings/services/sequence.service')

const customerAttrs = ['id', 'name', 'company', 'email', 'phone']
const invoiceAttrs  = ['id', 'invoiceNumber', 'invoiceDate', 'dueDate', 'total', 'amountPaid', 'status']

const baseInclude = [
  { model: Customer, as: 'customer', attributes: customerAttrs },
  { model: Invoice,  as: 'invoice',  attributes: invoiceAttrs, required: false },
]

const nextRefNo = (userId) => getNext('CN', userId)
const round2 = (v) => Math.round(Number(v || 0) * 100) / 100

const list = async ({ page = 1, limit = 20, search = '', status = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where  = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (search) where[Op.or] = [{ refNo: { [Op.like]: `%${search}%` } }, { reason: { [Op.like]: `%${search}%` } }]
  if (status) where.status = status

  const { count, rows } = await CreditNote.findAndCountAll({
    where, limit, offset,
    order: [['createdAt', 'DESC']],
    include: baseInclude,
    distinct: true,
  })
  return { total: count, page, limit, creditNotes: rows }
}

const getById = async (id) => {
  const cn = await CreditNote.findByPk(id, { include: baseInclude })
  if (!cn) throw { status: 404, message: 'Credit Note not found' }
  return cn
}

const customerInvoices = async ({ customerId, organizationId }) => {
  return Invoice.findAll({
    where: {
      customerId,
      organizationId: organizationId || null,
      dataFlag: { [Op.ne]: 2 },
      status: { [Op.notIn]: ['cancelled'] },
    },
    order: [['invoiceDate', 'DESC']],
    attributes: invoiceAttrs,
    limit: 200,
  })
}

const create = async ({ date, customerId, invoiceId, reason, amount, notes, userId, organizationId }) => {
  if (!customerId)              throw { status: 400, message: 'Customer is required' }
  if (!date)                    throw { status: 400, message: 'Date is required' }
  if (!reason?.trim())          throw { status: 400, message: 'Reason is required' }
  if (!amount || Number(amount) <= 0) throw { status: 400, message: 'Amount must be greater than 0' }

  const refNo = await nextRefNo(userId)
  const cn = await CreditNote.create({
    refNo, date, customerId,
    invoiceId: invoiceId || null,
    reason: reason.trim(),
    amount: Number(amount),
    notes: notes?.trim() || null,
    organizationId: organizationId || null,
    createdBy: userId || null,
    modifiedBy: userId || null,
  })
  return getById(cn.id)
}

// Apply / undo the CN's effect on the linked invoice's balance.
// direction: +1 (issue) bumps amountPaid; -1 (cancel) reverts.
const applyToInvoice = async (cn, direction) => {
  if (!cn.invoiceId) return
  const inv = await Invoice.findByPk(cn.invoiceId)
  if (!inv) return
  if (direction > 0) {
    const balance = Math.max(0, Number(inv.total) - Number(inv.amountPaid || 0))
    if (Number(cn.amount) > balance + 0.001) {
      throw { status: 400, message: `Credit Note amount (${cn.amount}) exceeds invoice outstanding balance (${balance})` }
    }
  }
  const delta = direction * Number(cn.amount)
  const newPaid = round2(Math.max(0, Number(inv.amountPaid || 0) + delta))
  const isFullySettled = newPaid + 0.001 >= Number(inv.total)
  await inv.update({
    amountPaid: newPaid,
    status:     isFullySettled ? 'paid' : (direction < 0 ? 'sent' : inv.status),
  })
}

// Issuing a CN: post Dr Revenue (+ Output VAT reversal) / Cr AR, and if linked
// to an invoice, reduce its outstanding balance (bump amountPaid). The CN amount
// must not exceed the linked invoice's remaining balance.
const issue = async (id, userId) => {
  const cn = await CreditNote.findByPk(id)
  if (!cn)                   throw { status: 404, message: 'Credit Note not found' }
  if (cn.status !== 'draft') throw { status: 400, message: 'Only draft credit notes can be issued' }
  await require('./tax-period.service').assertOpen(cn.date, cn.organizationId)

  await cn.update({ status: 'issued', modifiedBy: userId || null })
  try {
    await applyToInvoice(cn, +1)
    await require('./auto-journal.service').postCreditNote(await getById(id), userId)
  } catch (err) {
    try { await applyToInvoice(cn, -1) } catch (_) {}
    await cn.update({ status: 'draft' })
    throw err
  }
  return getById(id)
}

const cancel = async (id, userId) => {
  const cn = await CreditNote.findByPk(id)
  if (!cn)                                      throw { status: 404, message: 'Credit Note not found' }
  if (!['draft', 'issued'].includes(cn.status)) throw { status: 400, message: 'Cannot cancel an already cancelled credit note' }
  const previousStatus = cn.status
  if (previousStatus === 'issued') {
    await require('./tax-period.service').assertOpen(cn.date, cn.organizationId)
  }

  await cn.update({ status: 'cancelled', modifiedBy: userId || null })

  if (previousStatus === 'issued') {
    try {
      await applyToInvoice(cn, -1)
      await require('./auto-journal.service').reverseCreditNote(cn, userId, `credit note cancelled from "${previousStatus}"`)
    } catch (err) {
      try { await applyToInvoice(cn, +1) } catch (_) {}
      await cn.update({ status: previousStatus })
      throw err
    }
  }
  return getById(id)
}

const remove = async (id) => {
  const cn = await CreditNote.findByPk(id)
  if (!cn)                   throw { status: 404, message: 'Credit Note not found' }
  if (cn.status !== 'draft') throw { status: 400, message: 'Only draft credit notes can be deleted' }
  await cn.destroy()
}

module.exports = { list, getById, customerInvoices, create, issue, cancel, remove }
