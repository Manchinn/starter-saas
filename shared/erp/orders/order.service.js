const { Order, SalesOrderItem, Customer, Product, Item, sequelize } = require('../../../server/models')
const { Op } = require('sequelize')
const { toFixed } = require('../../../server/utils/fmt')

const generateOrderNumber = async () => {
  const count = await Order.count()
  const pad = String(count + 1).padStart(5, '0')
  return `ORD-${pad}`
}

const list = async ({ page = 1, limit = 20, search = '', status = '' }) => {
  const offset = (page - 1) * limit
  const where = {}
  if (search) where.orderNumber = { [Op.like]: `%${search}%` }
  if (status) where.status = status

  const { count, rows } = await Order.findAndCountAll({
    where,
    include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'company'] }],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  })

  return { total: count, page, limit, orders: rows }
}

const getById = async (id) => {
  const order = await Order.findByPk(id, {
    include: [
      { model: Customer, as: 'customer' },
      { model: SalesOrderItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }] },
    ],
  })
  if (!order) throw { status: 404, message: 'Order not found' }
  return order
}

const create = async ({ customerId, orderDate, notes, items = [], taxRate = 0 }) => {
  if (!items.length) throw { status: 400, message: 'Order must have at least one item' }

  const orderNumber = await generateOrderNumber()
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
  const tax   = toFixed(subtotal * (taxRate / 100), 2)
  const total = toFixed(subtotal + tax, 2)

  let createdId
  await sequelize.transaction(async (t) => {
    const order = await Order.create(
      { orderNumber, customerId: customerId || null, orderDate: orderDate || new Date(), notes, subtotal, tax, total },
      { transaction: t }
    )
    createdId = order.id

    for (const item of items) {
      const product    = item.productId ? await Product.findByPk(item.productId, { transaction: t }) : null
      const masterItem = item.itemId    ? await Item.findByPk(item.itemId,       { transaction: t }) : null
      await SalesOrderItem.create(
        {
          orderId:     order.id,
          itemId:      item.itemId    || null,
          productId:   item.productId || null,
          productName: item.productName || masterItem?.title || product?.name || 'Unknown',
          quantity:    item.quantity,
          unitPrice:   item.unitPrice,
          total:       toFixed(item.quantity * item.unitPrice, 2),
        },
        { transaction: t }
      )
    }
  })

  // Fetch the fully-populated order AFTER the transaction has committed
  return getById(createdId)
}

const updateStatus = async (id, status) => {
  const order = await Order.findByPk(id, {
    include: [{ model: SalesOrderItem, as: 'items' }]
  })
  if (!order) throw { status: 404, message: 'Order not found' }
  const oldStatus = order.status

  if (oldStatus === status) return getById(id)

  await sequelize.transaction(async (t) => {
    // Cut stock when moving to confirmed
    if (status === 'confirmed' && ['draft', 'cancelled'].includes(oldStatus)) {
      for (const item of order.items) {
        if (item.productId) {
          const product = await Product.findByPk(item.productId, { transaction: t })
          if (product) await product.update({ stock: product.stock - item.quantity }, { transaction: t })
        }
        if (item.itemId) {
          const masterItem = await Item.findByPk(item.itemId, { transaction: t })
          if (masterItem) await masterItem.update({ stock: masterItem.stock - item.quantity }, { transaction: t })
        }
      }
    }

    // Return stock when cancelled (if was previously confirmed/shipped/delivered)
    if (status === 'cancelled' && ['confirmed', 'shipped', 'delivered'].includes(oldStatus)) {
      for (const item of order.items) {
        if (item.productId) {
          const product = await Product.findByPk(item.productId, { transaction: t })
          if (product) await product.update({ stock: product.stock + item.quantity }, { transaction: t })
        }
        if (item.itemId) {
          const masterItem = await Item.findByPk(item.itemId, { transaction: t })
          if (masterItem) await masterItem.update({ stock: masterItem.stock + item.quantity }, { transaction: t })
        }
      }
    }

    await order.update({ status }, { transaction: t })
  })

  return getById(id)
}

const update = async (id, { customerId, orderDate, notes, taxRate, items }) => {
  const order = await Order.findByPk(id)
  if (!order) throw { status: 404, message: 'Order not found' }
  if (order.status !== 'draft') throw { status: 400, message: 'Only draft orders can be edited' }

  await sequelize.transaction(async (t) => {
    if (items) {
      await SalesOrderItem.destroy({ where: { orderId: id }, transaction: t })

      const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
      const rate = taxRate !== undefined ? taxRate : 0
      const tax   = toFixed(subtotal * (rate / 100), 2)
      const total = toFixed(subtotal + tax, 2)

      await order.update({ customerId: customerId || null, orderDate, notes, subtotal, tax, total }, { transaction: t })

      for (const item of items) {
        const product    = item.productId ? await Product.findByPk(item.productId, { transaction: t }) : null
        const masterItem = item.itemId    ? await Item.findByPk(item.itemId,       { transaction: t }) : null
        await SalesOrderItem.create(
          {
            orderId:     id,
            itemId:      item.itemId    || null,
            productId:   item.productId || null,
            productName: item.productName || masterItem?.title || product?.name || 'Unknown',
            quantity:    item.quantity,
            unitPrice:   item.unitPrice,
            total:       toFixed(item.quantity * item.unitPrice, 2),
          },
          { transaction: t }
        )
      }
    } else {
      await order.update({ customerId: customerId || null, orderDate, notes }, { transaction: t })
    }
  })

  return getById(id)
}

const remove = async (id) => {
  const order = await Order.findByPk(id)
  if (!order) throw { status: 404, message: 'Order not found' }
  if (order.status !== 'draft') throw { status: 400, message: 'Only draft orders can be deleted' }
  await order.destroy()
}

const listItems = async ({ page = 1, limit = 50, search = '' }) => {
  const offset = (page - 1) * limit
  const where = {}
  if (search) {
    where[Op.or] = [
      { productName: { [Op.like]: `%${search}%` } },
    ]
  }

  const { count, rows } = await SalesOrderItem.findAndCountAll({
    where,
    include: [
      { model: Order, as: 'order', attributes: ['orderNumber', 'status', 'orderDate'] },
      { model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'stock'] }
    ],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  })

  return { total: count, items: rows }
}

const getItemById = async (id) => {
  const item = await SalesOrderItem.findByPk(id, {
    include: [
      { model: Order, as: 'order', attributes: ['id', 'orderNumber', 'status', 'orderDate'] },
      { model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'stock'] },
    ],
  })
  if (!item) throw { status: 404, message: 'Order item not found' }
  return item
}

const recalcOrderTotals = async (orderId, t) => {
  const items = await SalesOrderItem.findAll({ where: { orderId }, transaction: t })
  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.total), 0)
  const order = await Order.findByPk(orderId, { transaction: t })
  const taxRate = parseFloat(order.subtotal) > 0 ? (parseFloat(order.tax) / parseFloat(order.subtotal)) : 0
  const newTax   = toFixed(subtotal * taxRate, 2)
  const newTotal = toFixed(subtotal + newTax, 2)
  await order.update({ subtotal: toFixed(subtotal, 2), tax: newTax, total: newTotal }, { transaction: t })
}

const updateItem = async (id, { productId, productName, quantity, unitPrice }) => {
  const item = await SalesOrderItem.findByPk(id, {
    include: [{ model: Order, as: 'order', attributes: ['id', 'status'] }],
  })
  if (!item) throw { status: 404, message: 'Order item not found' }
  if (item.order.status !== 'draft') throw { status: 400, message: 'Only items on draft orders can be edited' }

  return sequelize.transaction(async (t) => {
    const resolvedProductId = productId || null
    let resolvedName = productName

    if (resolvedProductId && !resolvedName) {
      const product = await Product.findByPk(resolvedProductId, { transaction: t })
      resolvedName = product?.name || 'Unknown'
    }

    const qty = quantity ?? item.quantity
    const price = unitPrice ?? item.unitPrice
    const lineTotal = toFixed(qty * price, 2)

    await item.update(
      {
        productId: resolvedProductId,
        productName: resolvedName || item.productName,
        quantity: qty,
        unitPrice: price,
        total: lineTotal,
      },
      { transaction: t }
    )

    await recalcOrderTotals(item.orderId, t)
    return getItemById(id)
  })
}

const deleteItem = async (id) => {
  const item = await SalesOrderItem.findByPk(id, {
    include: [{ model: Order, as: 'order', attributes: ['id', 'status'] }],
  })
  if (!item) throw { status: 404, message: 'Order item not found' }
  if (item.order.status !== 'draft') throw { status: 400, message: 'Only items on draft orders can be deleted' }

  return sequelize.transaction(async (t) => {
    const orderId = item.orderId
    await item.destroy({ transaction: t })
    await recalcOrderTotals(orderId, t)
  })
}

module.exports = { list, getById, create, update, updateStatus, remove, listItems, getItemById, updateItem, deleteItem }
