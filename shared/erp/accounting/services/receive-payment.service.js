const { ReceivePayment, ReceivePaymentInvoice, Invoice, Customer } = require('../../../../server/models')
const { Op } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { getNext } = require('../../settings/services/sequence.service')

const customerAttrs = ['id', 'name', 'company', 'email', 'phone']
const invoiceAttrs  = ['id', 'invoiceNumber', 'invoiceDate', 'dueDate', 'total', 'status']

const lineInclude = {
  model: ReceivePaymentInvoice,
  as: 'lines',
  include: [{ model: Invoice, as: 'invoice', attributes: invoiceAttrs }],
}

const nextRefNo = (userId) => getNext('RCP', userId)

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

const availableInvoices = async ({ customerId, organizationId }) => {
  const linked = await ReceivePaymentInvoice.findAll({
    include: [{
      model: ReceivePayment,
      as: 'receivePayment',
      where: { status: { [Op.in]: ['draft', 'confirmed'] }, organizationId: organizationId || null },
      attributes: [],
    }],
    attributes: ['invoiceId'],
  })
  const linkedIds = linked.map(l => l.invoiceId)

  const where = {
    customerId,
    organizationId: organizationId || null,
    status: { [Op.in]: ['sent'] },
    dataFlag: { [Op.ne]: 2 },
  }
  if (linkedIds.length) where.id = { [Op.notIn]: linkedIds }

  return Invoice.findAll({ where, order: [['invoiceDate', 'DESC']], attributes: invoiceAttrs })
}

const create = async ({ date, customerId, paymentMethod, reference, notes, invoiceIds = [], userId, organizationId }) => {
  if (!customerId)        throw { status: 400, message: 'Customer is required' }
  if (!date)              throw { status: 400, message: 'Date is required' }
  if (!paymentMethod)     throw { status: 400, message: 'Payment method is required' }
  if (!invoiceIds.length) throw { status: 400, message: 'Select at least one invoice' }

  const customer = await Customer.findByPk(customerId)
  if (!customer) throw { status: 400, message: 'Customer not found' }

  const invoices = await Invoice.findAll({
    where: { id: { [Op.in]: invoiceIds }, customerId, organizationId: organizationId || null },
  })
  if (invoices.length !== invoiceIds.length)
    throw { status: 400, message: 'One or more invoices not found or do not belong to this customer' }

  const total = invoices.reduce((s, inv) => s + Number(inv.total), 0)
  const refNo = await nextRefNo(userId)

  const t = await sequelize.transaction()
  try {
    const rp = await ReceivePayment.create(
      { refNo, date, customerId, paymentMethod, reference: reference || null,
        notes: notes || null, amount: total,
        organizationId: organizationId || null, createdBy: userId || null, modifiedBy: userId || null },
      { transaction: t },
    )
    for (const inv of invoices) {
      await ReceivePaymentInvoice.create(
        { receivePaymentId: rp.id, invoiceId: inv.id, amount: Number(inv.total), organizationId: organizationId || null },
        { transaction: t },
      )
    }
    await t.commit()
    return getById(rp.id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const confirm = async (id, userId) => {
  const rp = await ReceivePayment.findByPk(id, { include: [lineInclude] })
  if (!rp)                   throw { status: 404, message: 'Receive Payment not found' }
  if (rp.status !== 'draft') throw { status: 400, message: 'Only draft payments can be confirmed' }

  const t = await sequelize.transaction()
  try {
    await rp.update({ status: 'confirmed', modifiedBy: userId || null }, { transaction: t })
    for (const line of rp.lines) {
      const inv = await Invoice.findByPk(line.invoiceId, { transaction: t })
      if (inv && inv.status === 'sent') await inv.update({ status: 'paid' }, { transaction: t })
    }
    await t.commit()
    return getById(id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const cancel = async (id, userId) => {
  const rp = await ReceivePayment.findByPk(id)
  if (!rp)                   throw { status: 404, message: 'Receive Payment not found' }
  if (rp.status !== 'draft') throw { status: 400, message: 'Only draft payments can be cancelled' }
  await rp.update({ status: 'cancelled', modifiedBy: userId || null })
  return getById(id)
}

const remove = async (id) => {
  const rp = await ReceivePayment.findByPk(id)
  if (!rp)                   throw { status: 404, message: 'Receive Payment not found' }
  if (rp.status !== 'draft') throw { status: 400, message: 'Only draft payments can be deleted' }
  await rp.destroy()
}

module.exports = { list, getById, availableInvoices, create, confirm, cancel, remove }

