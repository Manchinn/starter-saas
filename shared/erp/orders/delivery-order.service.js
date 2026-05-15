const { DeliveryOrder, DeliveryOrderItem, Customer, Order, Product } = require('../../../server/models')
const { Op } = require('sequelize')
const sequelize = require('../../../server/config/database')
const { getNext } = require('../settings/sequence.service')

const customerAttrs = ['id', 'name', 'company', 'email', 'phone']
const orderAttrs    = ['id', 'orderNumber', 'orderDate', 'status']
const productAttrs  = ['id', 'name', 'sku']

const itemInclude = {
  model: DeliveryOrderItem,
  as: 'items',
  include: [{ model: Product, as: 'product', attributes: productAttrs }],
}

const nextRefNo = (userId) => getNext('DO', userId)

// ── List ──────────────────────────────────────────────────────────────────────
const list = async ({ page = 1, limit = 20, search = '', status = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where  = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (search) where[Op.or] = [{ refNo: { [Op.like]: `%${search}%` } }]
  if (status) where.status = status

  const { count, rows } = await DeliveryOrder.findAndCountAll({
    where, limit, offset,
    order: [['createdAt', 'DESC']],
    include: [{ model: Customer, as: 'customer', attributes: customerAttrs }],
    distinct: true,
  })
  return { total: count, page, limit, deliveryOrders: rows }
}

// ── Get by id ─────────────────────────────────────────────────────────────────
const getById = async (id) => {
  const doc = await DeliveryOrder.findByPk(id, {
    include: [
      itemInclude,
      { model: Customer, as: 'customer', attributes: customerAttrs },
      { model: Order,    as: 'salesOrder', attributes: orderAttrs },
    ],
  })
  if (!doc) throw { status: 404, message: 'Delivery Order not found' }
  return doc
}

// ── Create ────────────────────────────────────────────────────────────────────
const create = async ({ date, deliveryDate, orderId, customerId, address, notes, items = [], userId, organizationId }) => {
  if (!date)         throw { status: 400, message: 'Date is required' }
  if (!customerId)   throw { status: 400, message: 'Customer is required' }
  if (!items.length) throw { status: 400, message: 'At least one item is required' }

  const refNo = await nextRefNo(userId)
  const t = await sequelize.transaction()
  try {
    const doc = await DeliveryOrder.create(
      { refNo, date, deliveryDate: deliveryDate || null,
        orderId: orderId || null, customerId,
        address: address || null, notes: notes || null,
        organizationId: organizationId || null,
        createdBy: userId || null, modifiedBy: userId || null },
      { transaction: t },
    )
    for (const item of items) {
      if (!item.productName?.trim()) throw { status: 400, message: 'Each item needs a product name' }
      if (!item.qty || Number(item.qty) <= 0) throw { status: 400, message: 'Quantity must be greater than 0' }
      await DeliveryOrderItem.create(
        { deliveryOrderId: doc.id, productId: item.productId || null,
          productName: item.productName.trim(), qty: item.qty,
          notes: item.notes || null, organizationId: organizationId || null },
        { transaction: t },
      )
    }
    await t.commit()
    return getById(doc.id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

// ── Status transitions ────────────────────────────────────────────────────────
const TRANSITIONS = {
  draft:     ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped:   ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

async function transition(id, userId, from, to, errorMsg) {
  const doc = await DeliveryOrder.findByPk(id)
  if (!doc) throw { status: 404, message: 'Delivery Order not found' }
  if (doc.status !== from) throw { status: 400, message: errorMsg }
  await doc.update({ status: to, modifiedBy: userId || null })
  return getById(id)
}

const confirm = (id, userId) => transition(id, userId, 'draft',     'confirmed', 'Only draft delivery orders can be confirmed')
const ship    = (id, userId) => transition(id, userId, 'confirmed', 'shipped',   'Only confirmed delivery orders can be marked as shipped')
const deliver = (id, userId) => transition(id, userId, 'shipped',   'delivered', 'Only shipped delivery orders can be marked as delivered')

const cancel = async (id, userId) => {
  const doc = await DeliveryOrder.findByPk(id)
  if (!doc) throw { status: 404, message: 'Delivery Order not found' }
  if (!TRANSITIONS[doc.status]?.includes('cancelled')) throw { status: 400, message: 'Cannot cancel a delivered or already cancelled order' }
  await doc.update({ status: 'cancelled', modifiedBy: userId || null })
  return getById(id)
}

const remove = async (id) => {
  const doc = await DeliveryOrder.findByPk(id)
  if (!doc)                   throw { status: 404, message: 'Delivery Order not found' }
  if (doc.status !== 'draft') throw { status: 400, message: 'Only draft delivery orders can be deleted' }
  await doc.destroy()
}

const createInvoice = async (id, userId, organizationId) => {
  const doc = await getById(id)
  if (!['shipped', 'delivered'].includes(doc.status)) {
    throw { status: 400, message: 'Only shipped or delivered orders can be invoiced' }
  }

  // Try to fetch unit prices from the source Sales Order (DO items don't store price)
  const priceMap = {}
  if (doc.orderId) {
    const { SalesOrderItem } = require('../../../server/models')
    const orderItems = await SalesOrderItem.findAll({ where: { orderId: doc.orderId } })
    for (const oi of orderItems) {
      if (oi.productId) priceMap[oi.productId] = parseFloat(oi.unitPrice) || 0
      if (oi.productName) priceMap[`name:${oi.productName}`] = parseFloat(oi.unitPrice) || 0
    }
  }

  const invoiceSvc = require('../invoices/invoice.service')
  const invoice = await invoiceSvc.create({
    customerId:  doc.customerId,
    orderId:     doc.orderId || null,
    invoiceDate: new Date(),
    notes:       `Auto-created from Delivery Order ${doc.refNo}`,
    items: doc.items.map(i => ({
      productName: i.productName,
      quantity:    parseFloat(i.qty) || 0,
      unitPrice:   priceMap[i.productId] ?? priceMap[`name:${i.productName}`] ?? 0,
    })),
    taxRate: 0,
    userId,
    organizationId,
  })
  return { id: invoice.id }
}

module.exports = { list, getById, create, confirm, ship, deliver, cancel, remove, createInvoice }
