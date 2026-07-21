const { ok, created, fail } = require('../../core/response')
const connectionService = require('../../../shared/erp/line-integration/services/line-connection.service')
const lineService = require('../../../shared/erp/line-integration/services/line.service')
const catalogService = require('../../../shared/erp/line-integration/services/line-catalog.service')
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
      return ok(res, await catalogService.listCatalog(req.line.connection))
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async createOrder(req, res) {
    try {
      const order = await lineService.createLiffOrder({
        connection: req.line.connection,
        profile: req.line.profile,
        items: req.body.items,
        notes: req.body.notes,
      })
      return created(res, { order }, 'Order created')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async myOrders(req, res) {
    try {
      const { LineUserMapping } = require('../../models')
      const mapping = await LineUserMapping.findOne({
        where: {
          organizationId: req.line.connection.organizationId,
          lineUserId: req.line.profile.userId,
        },
      })
      if (!mapping) return ok(res, { orders: [] })
      const customerOrders = await orders.listForCustomer({
        customerId: mapping.customerId,
        organizationId: req.line.connection.organizationId,
      })
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
