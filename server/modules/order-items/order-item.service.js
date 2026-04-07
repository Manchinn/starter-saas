const { OrderItem, Order, Product, Item, Pricing } = require('../../models')
const { Op } = require('sequelize')

const itemIncludes = [
  { model: Order,   as: 'order',    attributes: ['id', 'orderNumber', 'status'] },
  { model: Product, as: 'product',  attributes: ['id', 'name', 'sku'] },
  { model: Item,    as: 'item',     attributes: ['id', 'title', 'stock'] },
  { model: Pricing, as: 'pricings', attributes: ['id', 'code', 'name', 'unitPrice', 'currency', 'status'] },
]

const list = async ({ page = 1, limit = 20, search = '', orderId = '' }) => {
  const offset = (page - 1) * limit
  const where = {}
  if (search) where.productName = { [Op.like]: `%${search}%` }
  if (orderId) where.orderId = orderId

  const { count, rows } = await OrderItem.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    include: itemIncludes,
  })

  return { total: count, page, limit, orderItems: rows }
}

const getById = async (id) => {
  const orderItem = await OrderItem.findByPk(id, { include: itemIncludes })
  if (!orderItem) throw { status: 404, message: 'Order item not found' }
  return orderItem
}

const listItems = async () => {
  const products = await Product.findAll({
    where: { status: 'active' },
    attributes: ['id', 'name', 'sku', 'stock'],
    order: [['name', 'ASC']],
  })
  return products.map(p => ({ id: p.id, title: p.name, sku: p.sku, stock: p.stock }))
}

const create = async ({ orderId, itemId, productId, productName, itemCode, autoCode, quantity = 1, unitPrice = 0 }) => {
  if (autoCode) {
    const seqSvc = require('../../../shared/erp/settings/sequence.service')
    itemCode = await seqSvc.getNext('OI', null)
  }
  if (orderId) {
    const order = await Order.findByPk(orderId)
    if (!order) throw { status: 404, message: 'Order not found' }
  }

  // Resolve item if provided (legacy Item model)
  let resolvedItemId = itemId || null
  if (resolvedItemId) {
    const masterItem = await Item.findByPk(resolvedItemId)
    if (!masterItem) throw { status: 404, message: 'Item not found' }
    if (masterItem.stock < quantity) throw { status: 400, message: `Insufficient stock. Available: ${masterItem.stock}` }
    await masterItem.decrement('stock', { by: quantity })
  }

  const total = parseFloat((quantity * unitPrice).toFixed(2))
  const orderItem = await OrderItem.create({
    orderId,
    itemId: resolvedItemId,
    productId: productId || null,
    productName,
    itemCode: itemCode || null,
    quantity,
    unitPrice,
    total,
  })
  return getById(orderItem.id)
}

const update = async (id, { itemId, productId, productName, itemCode, quantity, unitPrice }) => {
  const orderItem = await OrderItem.findByPk(id)
  if (!orderItem) throw { status: 404, message: 'Order item not found' }

  const newQty = quantity !== undefined ? quantity : orderItem.quantity
  const newPrice = unitPrice !== undefined ? unitPrice : parseFloat(orderItem.unitPrice)
  const oldItemId = orderItem.itemId
  const newItemId = itemId !== undefined ? (itemId || null) : oldItemId

  // Adjust stock when itemId or quantity changes
  if (oldItemId || newItemId) {
    // Restore stock to old item if it's being removed or changed
    if (oldItemId && (oldItemId !== newItemId || newQty !== orderItem.quantity)) {
      const oldMasterItem = await Item.findByPk(oldItemId)
      if (oldMasterItem) await oldMasterItem.increment('stock', { by: orderItem.quantity })
    }
    // Deduct from new item
    if (newItemId && (newItemId !== oldItemId || newQty !== orderItem.quantity)) {
      const newMasterItem = await Item.findByPk(newItemId)
      if (!newMasterItem) throw { status: 404, message: 'Item not found' }
      if (newMasterItem.stock < newQty) throw { status: 400, message: `Insufficient stock. Available: ${newMasterItem.stock}` }
      await newMasterItem.decrement('stock', { by: newQty })
    }
  }

  const total = parseFloat((newQty * newPrice).toFixed(2))
  await orderItem.update({
    ...(itemId !== undefined && { itemId: newItemId }),
    ...(productId !== undefined && { productId: productId || null }),
    ...(productName !== undefined && { productName }),
    ...(itemCode !== undefined && { itemCode: itemCode || null }),
    quantity: newQty,
    unitPrice: newPrice,
    total,
  })

  return getById(id)
}

const remove = async (id) => {
  const orderItem = await OrderItem.findByPk(id)
  if (!orderItem) throw { status: 404, message: 'Order item not found' }

  // Restore stock on delete
  if (orderItem.itemId) {
    const masterItem = await Item.findByPk(orderItem.itemId)
    if (masterItem) await masterItem.increment('stock', { by: orderItem.quantity })
  }

  await orderItem.destroy()
}

// Return order items with their linked price-list unit price — for sale line-item dropdowns
const saleLookup = async () => {
  const items = await OrderItem.findAll({
    attributes: ['id', 'productName', 'itemCode'],
    include: [{ model: Pricing, as: 'pricings', attributes: ['id', 'name', 'unitPrice', 'currency', 'status'] }],
    order: [['productName', 'ASC']],
  })
  return items.map(item => {
    const pricing = item.pricings?.find(p => p.status === 'active') || item.pricings?.[0] || null
    return {
      id:          item.id,
      name:        item.productName,
      code:        item.itemCode || null,
      unitPrice:   pricing ? parseFloat(pricing.unitPrice) : 0,
      currency:    pricing?.currency || 'USD',
      pricingName: pricing?.name    || null,
    }
  })
}

module.exports = { list, getById, listItems, saleLookup, create, update, remove }
