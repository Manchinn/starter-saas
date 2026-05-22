const { BillingNote, BillingNoteInvoice, Invoice, Customer } = require('../../../../server/models')
const { Op } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { getNext } = require('../../settings/services/sequence.service')

const customerAttrs = ['id', 'name', 'company', 'email', 'phone']
const invoiceAttrs  = ['id', 'invoiceNumber', 'invoiceDate', 'dueDate', 'total', 'status']

const lineInclude = {
  model: BillingNoteInvoice,
  as: 'lines',
  include: [{ model: Invoice, as: 'invoice', attributes: invoiceAttrs }],
}

const nextRefNo = (userId) => getNext('BN', userId)

// โ”€โ”€ List โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const list = async ({ page = 1, limit = 20, search = '', status = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where  = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (search) where[Op.or] = [{ refNo: { [Op.like]: `%${search}%` } }]
  if (status) where.status = status

  const { count, rows } = await BillingNote.findAndCountAll({
    where, limit, offset,
    order: [['createdAt', 'DESC']],
    include: [{ model: Customer, as: 'customer', attributes: customerAttrs }],
    distinct: true,
  })
  return { total: count, page, limit, billingNotes: rows }
}

// โ”€โ”€ Get by id โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const getById = async (id) => {
  const bn = await BillingNote.findByPk(id, {
    include: [
      lineInclude,
      { model: Customer, as: 'customer', attributes: customerAttrs },
    ],
  })
  if (!bn) throw { status: 404, message: 'Billing Note not found' }
  return bn
}

// โ”€โ”€ Available invoices for a customer โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const availableInvoices = async ({ customerId, organizationId }) => {
  // Invoices already linked to an active (non-cancelled) billing note
  const linked = await BillingNoteInvoice.findAll({
    include: [{
      model: BillingNote,
      as: 'billingNote',
      where: { status: { [Op.in]: ['draft', 'sent', 'paid'] }, organizationId: organizationId || null },
      attributes: [],
    }],
    attributes: ['invoiceId'],
  })
  const linkedIds = linked.map(l => l.invoiceId)

  const where = {
    customerId,
    organizationId: organizationId || null,
    status: { [Op.in]: ['draft', 'sent'] },
    dataFlag: { [Op.ne]: 2 },
  }
  if (linkedIds.length) where.id = { [Op.notIn]: linkedIds }

  return Invoice.findAll({ where, order: [['invoiceDate', 'DESC']], attributes: invoiceAttrs })
}

// โ”€โ”€ Create โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const create = async ({ date, dueDate, customerId, notes, invoiceIds = [], currency, exchangeRate, userId, organizationId }) => {
  if (!customerId)       throw { status: 400, message: 'Customer is required' }
  if (!date)             throw { status: 400, message: 'Date is required' }
  if (!invoiceIds.length) throw { status: 400, message: 'Select at least one invoice' }

  const customer = await Customer.findByPk(customerId)
  if (!customer) throw { status: 400, message: 'Customer not found' }

  const invoices = await Invoice.findAll({ where: { id: { [Op.in]: invoiceIds }, customerId, organizationId: organizationId || null } })
  if (invoices.length !== invoiceIds.length) throw { status: 400, message: 'One or more invoices not found or do not belong to this customer' }

  const total  = invoices.reduce((s, inv) => s + Number(inv.total), 0)
  const refNo  = await nextRefNo(userId)
  const fx = await require('../../settings/services/currency.service').getRateOn(currency, date, organizationId)
  const resolvedRate = exchangeRate != null && Number(exchangeRate) > 0 ? Number(exchangeRate) : fx

  const t = await sequelize.transaction()
  try {
    const bn = await BillingNote.create(
      { refNo, date, dueDate: dueDate || null, customerId, notes: notes || null,
        total, currency: currency || null, exchangeRate: resolvedRate,
        organizationId: organizationId || null, createdBy: userId || null, modifiedBy: userId || null },
      { transaction: t },
    )
    for (const inv of invoices) {
      await BillingNoteInvoice.create(
        { billingNoteId: bn.id, invoiceId: inv.id, amount: Number(inv.total), organizationId: organizationId || null },
        { transaction: t },
      )
    }
    await t.commit()
    return getById(bn.id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

// โ”€โ”€ Status transitions โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const TRANSITIONS = {
  draft:     ['sent', 'cancelled'],
  sent:      ['paid', 'cancelled'],
  paid:      [],
  cancelled: [],
}

const send = async (id, userId) => {
  const bn = await BillingNote.findByPk(id)
  if (!bn)                     throw { status: 404, message: 'Billing Note not found' }
  if (!TRANSITIONS.draft.includes('sent') || bn.status !== 'draft') throw { status: 400, message: 'Only draft billing notes can be sent' }
  await bn.update({ status: 'sent', modifiedBy: userId || null })
  return getById(id)
}

const markPaid = async (id, userId) => {
  const bn = await BillingNote.findByPk(id, { include: [lineInclude] })
  if (!bn)                    throw { status: 404, message: 'Billing Note not found' }
  if (bn.status !== 'sent')   throw { status: 400, message: 'Only sent billing notes can be marked as paid' }

  const t = await sequelize.transaction()
  try {
    await bn.update({ status: 'paid', modifiedBy: userId || null }, { transaction: t })
    for (const line of bn.lines) {
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
  const bn = await BillingNote.findByPk(id)
  if (!bn)                           throw { status: 404, message: 'Billing Note not found' }
  if (!['draft','sent'].includes(bn.status)) throw { status: 400, message: 'Cannot cancel a paid or already cancelled billing note' }
  await bn.update({ status: 'cancelled', modifiedBy: userId || null })
  return getById(id)
}

const remove = async (id) => {
  const bn = await BillingNote.findByPk(id)
  if (!bn)                   throw { status: 404, message: 'Billing Note not found' }
  if (bn.status !== 'draft') throw { status: 400, message: 'Only draft billing notes can be deleted' }
  await bn.destroy()
}

module.exports = { list, getById, availableInvoices, create, send, markPaid, cancel, remove }

