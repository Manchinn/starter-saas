const { Receipt, Customer, Invoice } = require('../../../server/models')
const { Op } = require('sequelize')

const generateReceiptNumber = async () => {
  const count = await Receipt.count()
  return `REC-${String(count + 1).padStart(5, '0')}`
}

const list = async ({ page = 1, limit = 20, search = '', status = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (search) where.receiptNumber = { [Op.like]: `%${search}%` }
  if (status) where.status = status

  const { count, rows } = await Receipt.findAndCountAll({
    where,
    include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'company'] }],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  })

  return { total: count, page, limit, receipts: rows }
}

const getById = async (id) => {
  const receipt = await Receipt.findByPk(id, {
    include: [
      { model: Customer, as: 'customer' },
      { model: Invoice,  as: 'invoice',  attributes: ['id', 'invoiceNumber', 'total'] },
    ],
  })
  if (!receipt) throw { status: 404, message: 'Receipt not found' }
  return receipt
}

const create = async ({ customerId, invoiceId, receiptDate, paymentMethod, amount, reference, notes, currency, exchangeRate, userId, organizationId }) => {
  if (!amount || amount <= 0) throw { status: 400, message: 'Amount must be greater than zero' }
  await require('../accounting/services/tax-period.service').assertOpen(receiptDate || new Date(), organizationId)

  const receiptNumber = await generateReceiptNumber()
  const fx = await require('../settings/services/currency.service').getRateOn(currency, receiptDate, organizationId)
  const resolvedRate = exchangeRate != null && Number(exchangeRate) > 0 ? Number(exchangeRate) : fx

  const receipt = await Receipt.create({
    receiptNumber,
    customerId:    customerId    || null,
    invoiceId:     invoiceId     || null,
    receiptDate:   receiptDate   || new Date(),
    paymentMethod: paymentMethod || 'cash',
    amount,
    reference:     reference     || null,
    notes:         notes         || null,
    currency:      currency || null,
    exchangeRate:  resolvedRate,
    organizationId: organizationId || null,
    createdBy: userId || null, modifiedBy: userId || null,
  })

  return getById(receipt.id)
}

const update = async (id, { customerId, invoiceId, receiptDate, paymentMethod, amount, reference, notes }, userId) => {
  const receipt = await Receipt.findByPk(id)
  if (!receipt) throw { status: 404, message: 'Receipt not found' }
  if (receipt.status !== 'draft') throw { status: 400, message: 'Only draft receipts can be edited' }
  if (amount !== undefined && amount <= 0) throw { status: 400, message: 'Amount must be greater than zero' }
  await require('../accounting/services/tax-period.service').assertOpen(receiptDate || receipt.receiptDate, receipt.organizationId)

  await receipt.update({
    customerId:    customerId    !== undefined ? customerId    || null : receipt.customerId,
    invoiceId:     invoiceId     !== undefined ? invoiceId     || null : receipt.invoiceId,
    receiptDate:   receiptDate   || receipt.receiptDate,
    paymentMethod: paymentMethod || receipt.paymentMethod,
    amount:        amount        !== undefined ? amount        : receipt.amount,
    reference:     reference     !== undefined ? reference     || null : receipt.reference,
    notes:         notes         !== undefined ? notes         || null : receipt.notes,
    modifiedBy:    userId || null,
  })

  return getById(id)
}

const updateStatus = async (id, status, userId) => {
  const receipt = await Receipt.findByPk(id)
  if (!receipt) throw { status: 404, message: 'Receipt not found' }
  if (receipt.status === status) return getById(id)

  const TRANSITIONS = {
    draft:     ['confirmed', 'cancelled'],
    confirmed: ['cancelled'],
    cancelled: [],
  }
  if (!TRANSITIONS[receipt.status]?.includes(status)) {
    throw { status: 400, message: `Cannot transition from "${receipt.status}" to "${status}"` }
  }

  const round2 = (v) => Math.round(Number(v || 0) * 100) / 100

  const previousStatus = receipt.status
  await receipt.update({ status })
  const autoJournal = require('../accounting/services/auto-journal.service')
  if (status === 'confirmed') {
    try {
      await autoJournal.postReceipt(await getById(id), userId)
      // Apply to linked invoice (single-invoice receipt)
      if (receipt.invoiceId) {
        const inv = await Invoice.findByPk(receipt.invoiceId)
        if (inv) {
          const newPaid = round2(Number(inv.amountPaid || 0) + Number(receipt.amount))
          const isFullySettled = newPaid + 0.001 >= Number(inv.total)
          await inv.update({ amountPaid: newPaid, status: isFullySettled ? 'paid' : inv.status })
        }
      }
    } catch (err) {
      await receipt.update({ status: previousStatus })
      throw err
    }
  }
  if (status === 'cancelled' && previousStatus === 'confirmed') {
    try {
      await autoJournal.reverseReceipt(receipt, userId, 'receipt cancelled after confirmation')
      if (receipt.invoiceId) {
        const inv = await Invoice.findByPk(receipt.invoiceId)
        if (inv) {
          const newPaid = round2(Math.max(0, Number(inv.amountPaid || 0) - Number(receipt.amount)))
          const isFullySettled = newPaid + 0.001 >= Number(inv.total)
          await inv.update({ amountPaid: newPaid, status: isFullySettled ? 'paid' : 'sent' })
        }
      }
    } catch (err) {
      await receipt.update({ status: previousStatus })
      throw err
    }
  }
  const audit = require('../audit/audit.service')
  audit.log({ userId, action: `receipt.${status}`, entityType: 'Receipt', entityId: id, summary: { from: previousStatus, to: status, receiptNumber: receipt.receiptNumber, amount: receipt.amount } })
  return getById(id)
}

const remove = async (id) => {
  const receipt = await Receipt.findByPk(id)
  if (!receipt) throw { status: 404, message: 'Receipt not found' }
  if (receipt.status !== 'draft') throw { status: 400, message: 'Only draft receipts can be deleted' }
  await receipt.destroy()
}

module.exports = { list, getById, create, update, updateStatus, remove }
