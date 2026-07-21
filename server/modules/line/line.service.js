const { validateSignature } = require('@line/bot-sdk')
const { LineConnection } = require('../../models')
const { decrypt } = require('./line.crypto')
const { ensureCustomer } = require('../../../shared/erp/line-integration/services/line-user.service')
const { pushText } = require('../../../shared/erp/line-integration/services/line-message.service')
const orders = require('../../../shared/erp/orders/services/order.service')
const productService = require('../../../shared/erp/products/services/product.service')

async function handleWebhook(req) {
  const body = req.body || {}
  const connection = await LineConnection.findOne({ where: { botUserId: body.destination, isActive: true } })
  if (!connection) throw { status: 404, message: 'Unknown LINE destination' }
  const signature = req.get('x-line-signature')
  if (!signature || !req.rawBody || !validateSignature(req.rawBody.toString('utf8'), decrypt(connection.channelSecretEncrypted), signature)) {
    throw { status: 401, message: 'Invalid LINE signature' }
  }
  for (const event of body.events || []) {
    if (event.source?.type !== 'user') continue
    // Establish the mapping early. A LIFF checkout later reuses this customer.
    if (event.type === 'follow' || event.type === 'message') {
      await ensureCustomer(connection, { userId: event.source.userId, displayName: event.source.userId })
    }
  }
}

async function createLiffOrder({ connection, profile, items, notes }) {
  if (!Array.isArray(items) || !items.length) throw { status: 400, message: 'Order must contain at least one item' }
  const mapping = await ensureCustomer(connection, profile)
  const quantities = new Map()
  for (const item of items) {
    const quantity = Number(item.quantity)
    if (!item.productId || !Number.isInteger(quantity) || quantity <= 0) {
      throw { status: 400, message: 'Each item must have a product and a positive whole quantity' }
    }
    quantities.set(item.productId, (quantities.get(item.productId) || 0) + quantity)
  }
  const orderItems = []
  for (const [productId, quantity] of quantities) {
    // Resolve every mutable commercial field server-side. The LIFF client is
    // untrusted and must not choose another tenant's product, price, or store.
    const product = await productService.getById(productId, connection.organizationId)
    if (product.status !== 'active' || quantity > Number(product.stock)) {
      throw { status: 400, message: `Insufficient stock for ${product.name}` }
    }
    if (!connection.defaultStoreId) throw { status: 400, message: 'LINE connection requires a default store' }
    const { storeStocks } = await productService.listStoreStocks(product.id, connection.organizationId)
    const storeStock = storeStocks.find((row) => row.storeId === connection.defaultStoreId)
    if (!storeStock || quantity > Number(storeStock.stock)) {
      throw { status: 400, message: `Insufficient stock for ${product.name} in the configured store` }
    }
    orderItems.push({
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: product.price,
      storeId: connection.defaultStoreId,
    })
  }
  let order
  try {
    order = await orders.create({
      customerId: mapping.customerId,
      orderDate: new Date().toISOString().slice(0, 10),
      notes: notes || 'Created from LINE LIFF',
      items: orderItems,
      userId: connection.organizationId,
      organizationId: connection.organizationId,
    })
  } catch (error) { throw error }
  let confirmed
  try {
    confirmed = await orders.updateStatus(order.id, 'confirmed', connection.organizationId, connection.organizationId)
  } catch (error) {
    // `create` commits a draft before the existing order service confirms it.
    // Do not leave that orphan draft behind when confirmation fails.
    try { await orders.remove(order.id, connection.organizationId) } catch (_) { /* preserve confirmation error */ }
    throw error
  }
  try { await pushText(connection, profile.userId, `Order ${confirmed.orderNumber} has been received.`) } catch (_) { /* checkout is successful even when LINE delivery is temporarily unavailable */ }
  return confirmed
}

module.exports = { handleWebhook, createLiffOrder }
