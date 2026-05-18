const { Order, SalesOrderItem, Customer, Product, Item, SaleItem, Store, StoreStock, StockMovement, sequelize } = require('../../../server/models')
const { Op } = require('sequelize')
const { toFixed } = require('../../../server/utils/fmt')

const generateOrderNumber = async () => {
  const count = await Order.count()
  const pad = String(count + 1).padStart(5, '0')
  return `ORD-${pad}`
}

const list = async ({ page = 1, limit = 20, search = '', status = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
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

  // Surface linked targets so the UI can disable conversion buttons
  const { DeliveryOrder, Invoice } = require('../../../server/models')
  const [linkedDO, linkedInv] = await Promise.all([
    DeliveryOrder.findOne({ where: { orderId: id, dataFlag: { [Op.ne]: 2 } }, attributes: ['id', 'refNo', 'status'] }),
    Invoice.findOne({       where: { orderId: id, dataFlag: { [Op.ne]: 2 } }, attributes: ['id', 'invoiceNumber', 'status'] }),
  ])
  const json = order.toJSON()
  json.linkedDeliveryOrder = linkedDO
  json.linkedInvoice       = linkedInv
  return json
}

const create = async ({ customerId, orderDate, notes, items = [], taxRate = 0, currency, exchangeRate, userId, organizationId }) => {
  if (!items.length) throw { status: 400, message: 'Order must have at least one item' }

  const orderNumber = await generateOrderNumber()
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
  const tax   = toFixed(subtotal * (taxRate / 100), 2)
  const total = toFixed(subtotal + tax, 2)
  const fx = await require('../settings/currency.service').getRateOn(currency, orderDate, organizationId)
  const resolvedRate = exchangeRate != null && Number(exchangeRate) > 0 ? Number(exchangeRate) : fx

  let createdId
  await sequelize.transaction(async (t) => {
    const order = await Order.create(
      { orderNumber, customerId: customerId || null, orderDate: orderDate || new Date(), notes, subtotal, tax, total, currency: currency || null, exchangeRate: resolvedRate, organizationId: organizationId || null, createdBy: userId || null, modifiedBy: userId || null },
      { transaction: t }
    )
    createdId = order.id

    for (const item of items) {
      const product    = item.productId ? await Product.findByPk(item.productId, { transaction: t }) : null
      const masterItem = item.itemId    ? await Item.findByPk(item.itemId,       { transaction: t }) : null
      if (item.productId && !item.storeId) throw { status: 400, message: `Store is required for item "${item.productName || 'Unknown'}"` }
      await SalesOrderItem.create(
        {
          orderId:     order.id,
          itemId:      item.itemId    || null,
          productId:   item.productId || null,
          saleItemId:  item.saleItemId || null,
          storeId:        item.storeId   || null,
          productName:    item.productName || masterItem?.title || product?.name || 'Unknown',
          quantity:       item.quantity,
          unitPrice:      item.unitPrice,
          total:          toFixed(item.quantity * item.unitPrice, 2),
          organizationId: organizationId || null,
        },
        { transaction: t }
      )
    }
  })

  // Fetch the fully-populated order AFTER the transaction has committed
  return getById(createdId)
}

const updateStatus = async (id, status, userId) => {
  const order = await Order.findByPk(id, {
    include: [{
      model: SalesOrderItem, as: 'items',
      include: [{ model: SaleItem, as: 'saleItem', attributes: ['id', 'productId'] }],
    }]
  })
  if (!order) throw { status: 404, message: 'Order not found' }
  const oldStatus = order.status

  if (oldStatus === status) return getById(id)

  const resolveProductId = (item) => item.productId || item.saleItem?.productId || null

  await sequelize.transaction(async (t) => {
    // Cut stock when moving to confirmed
    if (status === 'confirmed' && ['draft', 'cancelled'].includes(oldStatus)) {
      const storeIds = [...new Set(order.items.map(i => i.storeId).filter(Boolean))]
      const { checkStoreLock } = require('../stock/stock-count/stock-count.service')
      await checkStoreLock(storeIds)
      for (const item of order.items) {
        const productId = resolveProductId(item)
        if (productId) {
          const product = await Product.findByPk(productId, { transaction: t })
          if (product) {
            const before = parseFloat(product.stock)
            const after  = before - item.quantity
            await product.update({ stock: after }, { transaction: t })

            if (item.storeId) {
              const [storeStock] = await StoreStock.findOrCreate({
                where: { productId, storeId: item.storeId },
                defaults: { stock: 0 },
                transaction: t,
              })
              await storeStock.update({ stock: storeStock.stock - item.quantity }, { transaction: t })
            }

            await StockMovement.create({
              productId,
              storeId:     item.storeId || null,
              type:        'sale',
              qty:         -item.quantity,
              stockBefore: before,
              stockAfter:  after,
              refType:     'SalesOrder',
              refId:       order.id,
              refNo:       order.orderNumber,
              notes:       `Sales Order ${order.orderNumber}`,
            }, { transaction: t })
          }
        }
        if (item.itemId) {
          const masterItem = await Item.findByPk(item.itemId, { transaction: t })
          if (masterItem) await masterItem.update({ stock: masterItem.stock - item.quantity }, { transaction: t })
        }
      }
    }

    // Return stock when cancelled (if was previously confirmed/shipped/delivered)
    if (status === 'cancelled' && ['confirmed', 'shipped', 'delivered'].includes(oldStatus)) {
      const storeIds = [...new Set(order.items.map(i => i.storeId).filter(Boolean))]
      const { checkStoreLock } = require('../stock/stock-count/stock-count.service')
      await checkStoreLock(storeIds)
      for (const item of order.items) {
        const productId = resolveProductId(item)
        if (productId) {
          const product = await Product.findByPk(productId, { transaction: t })
          if (product) {
            const before = parseFloat(product.stock)
            const after  = before + item.quantity
            await product.update({ stock: after }, { transaction: t })

            if (item.storeId) {
              const [storeStock] = await StoreStock.findOrCreate({
                where: { productId, storeId: item.storeId },
                defaults: { stock: 0 },
                transaction: t,
              })
              await storeStock.update({ stock: storeStock.stock + item.quantity }, { transaction: t })
            }

            await StockMovement.create({
              productId,
              storeId:     item.storeId || null,
              type:        'sale_cancel',
              qty:         item.quantity,
              stockBefore: before,
              stockAfter:  after,
              refType:     'SalesOrder',
              refId:       order.id,
              refNo:       order.orderNumber,
              notes:       `Cancelled Sales Order ${order.orderNumber}`,
            }, { transaction: t })
          }
        }
        if (item.itemId) {
          const masterItem = await Item.findByPk(item.itemId, { transaction: t })
          if (masterItem) await masterItem.update({ stock: masterItem.stock + item.quantity }, { transaction: t })
        }
      }
    }

    await order.update({ status }, { transaction: t })
  })

  require('../audit/audit.service').log({
    userId,
    action: `order.${status}`,
    entityType: 'Order',
    entityId: id,
    summary: { from: oldStatus, to: status, orderNumber: order.orderNumber, total: order.total },
  })

  return getById(id)
}

const update = async (id, { customerId, orderDate, notes, taxRate, currency, exchangeRate, items }, userId) => {
  const order = await Order.findByPk(id)
  if (!order) throw { status: 404, message: 'Order not found' }
  if (order.status !== 'draft') throw { status: 400, message: 'Only draft orders can be edited' }

  const headerExtras = {}
  if (currency !== undefined) headerExtras.currency = currency || null
  if (currency !== undefined || exchangeRate !== undefined) {
    const fx = await require('../settings/currency.service').getRateOn(currency, orderDate || order.orderDate, order.organizationId)
    headerExtras.exchangeRate = exchangeRate != null && Number(exchangeRate) > 0 ? Number(exchangeRate) : fx
  }

  await sequelize.transaction(async (t) => {
    if (items) {
      await SalesOrderItem.destroy({ where: { orderId: id }, transaction: t })

      const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
      const rate = taxRate !== undefined ? taxRate : 0
      const tax   = toFixed(subtotal * (rate / 100), 2)
      const total = toFixed(subtotal + tax, 2)

      await order.update({ customerId: customerId || null, orderDate, notes, taxRate: rate, subtotal, tax, total, ...headerExtras, modifiedBy: userId || null }, { transaction: t })

      for (const item of items) {
        const product    = item.productId ? await Product.findByPk(item.productId, { transaction: t }) : null
        const masterItem = item.itemId    ? await Item.findByPk(item.itemId,       { transaction: t }) : null
        if (item.productId && !item.storeId) throw { status: 400, message: `Store is required for item "${item.productName || 'Unknown'}"` }
        await SalesOrderItem.create(
          {
            orderId:     id,
            itemId:      item.itemId    || null,
            productId:   item.productId || null,
            saleItemId:  item.saleItemId || null,
            storeId:     item.storeId   || null,
            productName: item.productName || masterItem?.title || product?.name || 'Unknown',
            quantity:    item.quantity,
            unitPrice:   item.unitPrice,
            total:       toFixed(item.quantity * item.unitPrice, 2),
          },
          { transaction: t }
        )
      }
    } else {
      await order.update({ customerId: customerId || null, orderDate, notes, ...headerExtras, modifiedBy: userId || null }, { transaction: t })
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

const createDeliveryOrder = async (id, userId, organizationId) => {
  const order = await getById(id)
  if (!['confirmed', 'shipped', 'delivered'].includes(order.status)) {
    throw { status: 400, message: 'Only confirmed orders can generate a delivery order' }
  }
  const { DeliveryOrder, DeliveryOrderItem } = require('../../../server/models')

  const existing = await DeliveryOrder.findOne({
    where: { orderId: order.id, dataFlag: { [Op.ne]: 2 } },
    attributes: ['id', 'refNo'],
  })
  if (existing) throw { status: 400, message: `Delivery order ${existing.refNo} already exists for this sales order. Cancel it first to create a new one.` }
  const { getNext } = require('../settings/sequence.service')

  const refNo = await getNext('DO', userId)
  const today = new Date().toISOString().slice(0, 10)

  let createdId
  await sequelize.transaction(async (t) => {
    const doc = await DeliveryOrder.create({
      refNo,
      date: today,
      orderId: order.id,
      customerId: order.customerId || null,
      address: order.customer?.address || null,
      notes: `Auto-created from Sales Order ${order.orderNumber}`,
      organizationId: organizationId || null,
      createdBy: userId || null,
      modifiedBy: userId || null,
    }, { transaction: t })
    createdId = doc.id

    for (const item of order.items) {
      await DeliveryOrderItem.create({
        deliveryOrderId: doc.id,
        productId:       item.productId || null,
        productName:     item.productName,
        qty:             item.quantity,
        notes:           null,
        organizationId:  organizationId || null,
      }, { transaction: t })
    }
  })

  return { id: createdId }
}

const createInvoice = async (id, userId, organizationId) => {
  const order = await getById(id)
  if (!['confirmed', 'shipped', 'delivered'].includes(order.status)) {
    throw { status: 400, message: 'Only confirmed orders can generate an invoice' }
  }
  const { Invoice } = require('../../../server/models')
  const existing = await Invoice.findOne({
    where: { orderId: order.id, dataFlag: { [Op.ne]: 2 } },
    attributes: ['id', 'invoiceNumber'],
  })
  if (existing) throw { status: 400, message: `Invoice ${existing.invoiceNumber} already exists for this sales order. Cancel it first to create a new one.` }

  const invoiceSvc = require('../invoices/invoice.service')
  const invoice = await invoiceSvc.create({
    customerId:  order.customerId,
    orderId:     order.id,
    invoiceDate: new Date(),
    notes:       `Auto-created from Sales Order ${order.orderNumber}`,
    items: order.items.map(i => ({
      productName: i.productName,
      quantity:    i.quantity,
      unitPrice:   parseFloat(i.unitPrice) || 0,
    })),
    taxRate: parseFloat(order.subtotal) > 0
      ? toFixed((parseFloat(order.tax) / parseFloat(order.subtotal)) * 100, 2)
      : 0,
    userId,
    organizationId,
  })
  return { id: invoice.id }
}

module.exports = { list, getById, create, update, updateStatus, remove, listItems, getItemById, updateItem, deleteItem, createDeliveryOrder, createInvoice }
