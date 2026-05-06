const { Invoice, InvoiceItem, Customer, Order, sequelize } = require('../../../server/models')
const { Op } = require('sequelize')
const { toFixed } = require('../../../server/utils/fmt')

const generateInvoiceNumber = async () => {
  const count = await Invoice.count()
  return `INV-${String(count + 1).padStart(5, '0')}`
}

const list = async ({ page = 1, limit = 20, search = '', status = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (search) where.invoiceNumber = { [Op.like]: `%${search}%` }
  if (status) where.status = status

  const { count, rows } = await Invoice.findAndCountAll({
    where,
    include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'company'] }],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  })

  return { total: count, page, limit, invoices: rows }
}

const getById = async (id) => {
  const invoice = await Invoice.findByPk(id, {
    include: [
      { model: Customer, as: 'customer' },
      { model: Order,    as: 'order',    attributes: ['id', 'orderNumber'] },
      { model: InvoiceItem, as: 'items' },
    ],
  })
  if (!invoice) throw { status: 404, message: 'Invoice not found' }
  return invoice
}

const create = async ({ customerId, orderId, invoiceDate, dueDate, notes, items = [], taxRate = 0, userId, organizationId }) => {
  if (!items.length) throw { status: 400, message: 'Invoice must have at least one item' }

  const invoiceNumber = await generateInvoiceNumber()
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
  const tax   = toFixed(subtotal * (taxRate / 100), 2)
  const total = toFixed(subtotal + tax, 2)

  let createdId
  await sequelize.transaction(async (t) => {
    const invoice = await Invoice.create(
      {
        invoiceNumber,
        customerId:  customerId  || null,
        orderId:     orderId     || null,
        invoiceDate: invoiceDate || new Date(),
        dueDate:     dueDate     || null,
        notes,
        subtotal,
        tax,
        total,
        organizationId: organizationId || null,
        createdBy: userId || null, modifiedBy: userId || null,
      },
      { transaction: t }
    )
    createdId = invoice.id

    for (const item of items) {
      await InvoiceItem.create(
        {
          invoiceId:      invoice.id,
          organizationId: organizationId || null,
          productName: item.productName || 'Item',
          description: item.description || null,
          quantity:    item.quantity,
          unitPrice:   item.unitPrice,
          total:       toFixed(item.quantity * item.unitPrice, 2),
        },
        { transaction: t }
      )
    }
  })

  return getById(createdId)
}

const update = async (id, { customerId, orderId, invoiceDate, dueDate, notes, taxRate, items }, userId) => {
  const invoice = await Invoice.findByPk(id)
  if (!invoice) throw { status: 404, message: 'Invoice not found' }
  if (invoice.status !== 'draft') throw { status: 400, message: 'Only draft invoices can be edited' }

  await sequelize.transaction(async (t) => {
    if (items) {
      await InvoiceItem.destroy({ where: { invoiceId: id }, transaction: t })

      const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
      const rate  = taxRate !== undefined ? taxRate : 0
      const tax   = toFixed(subtotal * (rate / 100), 2)
      const total = toFixed(subtotal + tax, 2)

      await invoice.update(
        { customerId: customerId || null, orderId: orderId || null, invoiceDate, dueDate, notes, subtotal, tax, total, modifiedBy: userId || null },
        { transaction: t }
      )

      for (const item of items) {
        await InvoiceItem.create(
          {
            invoiceId:   id,
            productName: item.productName || 'Item',
            description: item.description || null,
            quantity:    item.quantity,
            unitPrice:   item.unitPrice,
            total:       toFixed(item.quantity * item.unitPrice, 2),
          },
          { transaction: t }
        )
      }
    } else {
      await invoice.update({ customerId: customerId || null, orderId: orderId || null, invoiceDate, dueDate, notes, modifiedBy: userId || null }, { transaction: t })
    }
  })

  return getById(id)
}

const updateStatus = async (id, status) => {
  const invoice = await Invoice.findByPk(id)
  if (!invoice) throw { status: 404, message: 'Invoice not found' }
  if (invoice.status === status) return getById(id)

  const TRANSITIONS = {
    draft:     ['sent', 'cancelled'],
    sent:      ['paid', 'cancelled'],
    paid:      [],
    cancelled: [],
  }
  if (!TRANSITIONS[invoice.status]?.includes(status)) {
    throw { status: 400, message: `Cannot transition from "${invoice.status}" to "${status}"` }
  }

  await invoice.update({ status })
  return getById(id)
}

const remove = async (id) => {
  const invoice = await Invoice.findByPk(id)
  if (!invoice) throw { status: 404, message: 'Invoice not found' }
  if (invoice.status !== 'draft') throw { status: 400, message: 'Only draft invoices can be deleted' }
  await invoice.destroy()
}

module.exports = { list, getById, create, update, updateStatus, remove }
