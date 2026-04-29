const { Receipt, Customer, Invoice } = require('../../../server/models')
const { Op } = require('sequelize')

const generateReceiptNumber = async () => {
  const count = await Receipt.count()
  return `REC-${String(count + 1).padStart(5, '0')}`
}

const list = async ({ page = 1, limit = 20, search = '', status = '' }) => {
  const offset = (page - 1) * limit
  const where = {}
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

const create = async ({ customerId, invoiceId, receiptDate, paymentMethod, amount, reference, notes }) => {
  if (!amount || amount <= 0) throw { status: 400, message: 'Amount must be greater than zero' }

  const receiptNumber = await generateReceiptNumber()

  const receipt = await Receipt.create({
    receiptNumber,
    customerId:    customerId    || null,
    invoiceId:     invoiceId     || null,
    receiptDate:   receiptDate   || new Date(),
    paymentMethod: paymentMethod || 'cash',
    amount,
    reference:     reference     || null,
    notes:         notes         || null,
  })

  return getById(receipt.id)
}

const update = async (id, { customerId, invoiceId, receiptDate, paymentMethod, amount, reference, notes }) => {
  const receipt = await Receipt.findByPk(id)
  if (!receipt) throw { status: 404, message: 'Receipt not found' }
  if (receipt.status !== 'draft') throw { status: 400, message: 'Only draft receipts can be edited' }
  if (amount !== undefined && amount <= 0) throw { status: 400, message: 'Amount must be greater than zero' }

  await receipt.update({
    customerId:    customerId    !== undefined ? customerId    || null : receipt.customerId,
    invoiceId:     invoiceId     !== undefined ? invoiceId     || null : receipt.invoiceId,
    receiptDate:   receiptDate   || receipt.receiptDate,
    paymentMethod: paymentMethod || receipt.paymentMethod,
    amount:        amount        !== undefined ? amount        : receipt.amount,
    reference:     reference     !== undefined ? reference     || null : receipt.reference,
    notes:         notes         !== undefined ? notes         || null : receipt.notes,
  })

  return getById(id)
}

const updateStatus = async (id, status) => {
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

  await receipt.update({ status })
  return getById(id)
}

const remove = async (id) => {
  const receipt = await Receipt.findByPk(id)
  if (!receipt) throw { status: 404, message: 'Receipt not found' }
  if (receipt.status !== 'draft') throw { status: 400, message: 'Only draft receipts can be deleted' }
  await receipt.destroy()
}

module.exports = { list, getById, create, update, updateStatus, remove }
