const { DebitNote, Invoice, Customer } = require('../../../../server/models')
const { Op } = require('sequelize')
const { getNext } = require('../../settings/sequence.service')

const customerAttrs = ['id', 'name', 'company', 'email', 'phone']
const invoiceAttrs  = ['id', 'invoiceNumber', 'invoiceDate', 'dueDate', 'total', 'status']

const baseInclude = [
  { model: Customer, as: 'customer', attributes: customerAttrs },
  { model: Invoice,  as: 'invoice',  attributes: invoiceAttrs, required: false },
]

const nextRefNo = (userId) => getNext('DN', userId)

// โ”€โ”€ List โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const list = async ({ page = 1, limit = 20, search = '', status = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where  = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (search) where[Op.or] = [{ refNo: { [Op.like]: `%${search}%` } }, { reason: { [Op.like]: `%${search}%` } }]
  if (status) where.status = status

  const { count, rows } = await DebitNote.findAndCountAll({
    where, limit, offset,
    order: [['createdAt', 'DESC']],
    include: baseInclude,
    distinct: true,
  })
  return { total: count, page, limit, debitNotes: rows }
}

// โ”€โ”€ Get by id โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const getById = async (id) => {
  const dn = await DebitNote.findByPk(id, { include: baseInclude })
  if (!dn) throw { status: 404, message: 'Debit Note not found' }
  return dn
}

// โ”€โ”€ Customer invoices โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
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

// โ”€โ”€ Create โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const create = async ({ date, customerId, invoiceId, reason, amount, notes, userId, organizationId }) => {
  if (!customerId)              throw { status: 400, message: 'Customer is required' }
  if (!date)                    throw { status: 400, message: 'Date is required' }
  if (!reason?.trim())          throw { status: 400, message: 'Reason is required' }
  if (!amount || Number(amount) <= 0) throw { status: 400, message: 'Amount must be greater than 0' }

  const refNo = await nextRefNo(userId)
  const dn = await DebitNote.create({
    refNo, date, customerId,
    invoiceId: invoiceId || null,
    reason: reason.trim(),
    amount: Number(amount),
    notes: notes?.trim() || null,
    organizationId: organizationId || null,
    createdBy: userId || null,
    modifiedBy: userId || null,
  })
  return getById(dn.id)
}

// โ”€โ”€ Status transitions โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const issue = async (id, userId) => {
  const dn = await DebitNote.findByPk(id)
  if (!dn)                   throw { status: 404, message: 'Debit Note not found' }
  if (dn.status !== 'draft') throw { status: 400, message: 'Only draft debit notes can be issued' }
  await dn.update({ status: 'issued', modifiedBy: userId || null })
  return getById(id)
}

const cancel = async (id, userId) => {
  const dn = await DebitNote.findByPk(id)
  if (!dn)                                      throw { status: 404, message: 'Debit Note not found' }
  if (!['draft', 'issued'].includes(dn.status)) throw { status: 400, message: 'Cannot cancel an already cancelled debit note' }
  await dn.update({ status: 'cancelled', modifiedBy: userId || null })
  return getById(id)
}

const remove = async (id) => {
  const dn = await DebitNote.findByPk(id)
  if (!dn)                   throw { status: 404, message: 'Debit Note not found' }
  if (dn.status !== 'draft') throw { status: 400, message: 'Only draft debit notes can be deleted' }
  await dn.destroy()
}

module.exports = { list, getById, customerInvoices, create, issue, cancel, remove }

