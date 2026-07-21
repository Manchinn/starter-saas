const { ok, created, fail } = require('../../core/response')
const connectionService = require('../../../shared/erp/line-integration/services/line-connection.service')
const lineService = require('./line.service')
const productService = require('../../../shared/erp/products/services/product.service')
const orders = require('../../../shared/erp/orders/services/order.service')

const organizationIdFor = (req) => req.user.organizationId || req.user.id

module.exports = {
  async getConnection(req, res) {
    try { return ok(res, { connection: await connectionService.get(organizationIdFor(req)) }) }
    catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async saveConnection(req, res) {
    try { return ok(res, { connection: await connectionService.save(organizationIdFor(req), req.body) }, 'LINE connection saved') }
    catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async publicLiffConfig(req, res) {
    try { return ok(res, await connectionService.getPublicLiffConfig(req.params.organizationId)) }
    catch (err) { return fail(res, err.message, err.status || 404) }
  },
  async catalog(req, res) {
    try {
      const result = await productService.list({ page: 1, limit: 100, status: 'active', organizationId: req.line.connection.organizationId })
      if (!req.line.connection.defaultStoreId) throw { status: 400, message: 'LINE connection requires a default store' }
      const stockByProduct = await Promise.all(result.products.map(async (product) => {
        const { storeStocks } = await productService.listStoreStocks(product.id, req.line.connection.organizationId)
        return [product.id, Number(storeStocks.find((row) => row.storeId === req.line.connection.defaultStoreId)?.stock || 0)]
      }))
      const availableStock = new Map(stockByProduct)
      const products = result.products
        .filter((product) => availableStock.get(product.id) > 0)
        .map((product) => ({ id: product.id, name: product.name, description: product.description, price: product.price, stock: availableStock.get(product.id) }))
      return ok(res, { products, defaultStoreId: req.line.connection.defaultStoreId })
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async createOrder(req, res) {
    try {
      const order = await lineService.createLiffOrder({ connection: req.line.connection, profile: req.line.profile, items: req.body.items, notes: req.body.notes })
      return created(res, { order }, 'Order created')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async myOrders(req, res) {
    try {
      const { LineUserMapping } = require('../../models')
      const mapping = await LineUserMapping.findOne({ where: { organizationId: req.line.connection.organizationId, lineUserId: req.line.profile.userId } })
      if (!mapping) return ok(res, { orders: [] })
      const customerOrders = await orders.listForCustomer({ customerId: mapping.customerId, organizationId: req.line.connection.organizationId })
      return ok(res, { orders: customerOrders })
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async webhook(req, res) {
    try {
      await lineService.handleWebhook(req)
      return res.status(200).send('OK')
    } catch (err) {
      return res.status(err.status || 400).send(err.message || 'Webhook failed')
    }
  },
}
