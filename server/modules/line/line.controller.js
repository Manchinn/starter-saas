const { ok, created, fail } = require('../../core/response')
const connectionService = require('../../../shared/erp/line-integration/services/line-connection.service')
const lineService = require('../../../shared/erp/line-integration/services/line.service')
const catalogService = require('../../../shared/erp/line-integration/services/line-catalog.service')
const richMenuService = require('../../../shared/erp/line-integration/services/line-rich-menu.service')
const orders = require('../../../shared/erp/orders/services/order.service')
const logger = require('../../core/logger')

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
      // LINE retries on non-2xx; log the reason so verification failures are diagnosable.
      logger.warn('LINE webhook rejected', { status: err.status || 400, message: err.message })
      return res.status(err.status || 400).send(err.message || 'Webhook failed')
    }
  },

  // ---- Rich menu ----
  async listRichMenus(req, res) {
    try {
      return ok(res, { richMenus: await richMenuService.listRichMenus(organizationIdFor(req)) })
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async getRichMenu(req, res) {
    try {
      return ok(res, { richMenu: await richMenuService.getRichMenu(organizationIdFor(req), req.params.richMenuId) })
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async createRichMenu(req, res) {
    try {
      const result = await richMenuService.createRichMenu(organizationIdFor(req), req.body)
      return created(res, result, 'Rich menu created')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async validateRichMenu(req, res) {
    try {
      return ok(res, await richMenuService.validateRichMenuObject(organizationIdFor(req), req.body))
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async deleteRichMenu(req, res) {
    try {
      return ok(res, await richMenuService.deleteRichMenu(organizationIdFor(req), req.params.richMenuId), 'Rich menu deleted')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async uploadRichMenuImage(req, res) {
    try {
      const { imageBase64, contentType } = req.body
      if (!imageBase64) return fail(res, 'imageBase64 is required')
      return ok(res, await richMenuService.uploadRichMenuImage(
        organizationIdFor(req), req.params.richMenuId, imageBase64, contentType || 'image/png',
      ), 'Image uploaded')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async downloadRichMenuImage(req, res) {
    try {
      const result = await richMenuService.downloadRichMenuImage(organizationIdFor(req), req.params.richMenuId)
      return ok(res, result)
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async setDefaultRichMenu(req, res) {
    try {
      return ok(res, await richMenuService.setDefaultRichMenu(organizationIdFor(req), req.params.richMenuId), 'Default rich menu set')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async getDefaultRichMenu(req, res) {
    try {
      return ok(res, await richMenuService.getDefaultRichMenu(organizationIdFor(req)))
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async cancelDefaultRichMenu(req, res) {
    try {
      return ok(res, await richMenuService.cancelDefaultRichMenu(organizationIdFor(req)), 'Default rich menu cancelled')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async linkRichMenuToUser(req, res) {
    try {
      return ok(res, await richMenuService.linkRichMenuToUser(
        organizationIdFor(req), req.params.userId, req.params.richMenuId,
      ), 'Rich menu linked to user')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async getRichMenuOfUser(req, res) {
    try {
      return ok(res, await richMenuService.getRichMenuOfUser(organizationIdFor(req), req.params.userId))
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async unlinkRichMenuFromUser(req, res) {
    try {
      return ok(res, await richMenuService.unlinkRichMenuFromUser(
        organizationIdFor(req), req.params.userId,
      ), 'Rich menu unlinked from user')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async createRichMenuAlias(req, res) {
    try {
      const { aliasId, richMenuId } = req.body
      if (!aliasId || !richMenuId) return fail(res, 'aliasId and richMenuId are required')
      return created(res, await richMenuService.createRichMenuAlias(organizationIdFor(req), aliasId, richMenuId), 'Alias created')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async listRichMenuAliases(req, res) {
    try {
      return ok(res, { aliases: await richMenuService.listRichMenuAliases(organizationIdFor(req)) })
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async getRichMenuAlias(req, res) {
    try {
      return ok(res, await richMenuService.getRichMenuAlias(organizationIdFor(req), req.params.aliasId))
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async updateRichMenuAlias(req, res) {
    try {
      return ok(res, await richMenuService.updateRichMenuAlias(
        organizationIdFor(req), req.params.aliasId, req.body.richMenuId,
      ), 'Alias updated')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async deleteRichMenuAlias(req, res) {
    try {
      return ok(res, await richMenuService.deleteRichMenuAlias(organizationIdFor(req), req.params.aliasId), 'Alias deleted')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },

  // Bulk user-level operations (1-500 users per call)
  async bulkLinkRichMenu(req, res) {
    try {
      const { richMenuId, userIds } = req.body
      if (!richMenuId || !userIds) return fail(res, 'richMenuId and userIds are required')
      return ok(res, await richMenuService.bulkLinkRichMenu(organizationIdFor(req), richMenuId, userIds), 'Rich menus linked to users')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async bulkUnlinkRichMenu(req, res) {
    try {
      const { userIds } = req.body
      if (!userIds) return fail(res, 'userIds is required')
      return ok(res, await richMenuService.bulkUnlinkRichMenu(organizationIdFor(req), userIds), 'Rich menus unlinked from users')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },

  // Batch menu-level operations (1-1000 ops per batch)
  async submitRichMenuBatch(req, res) {
    try {
      if (!req.body.operations) return fail(res, 'operations is required')
      return ok(res, await richMenuService.submitRichMenuBatch(organizationIdFor(req), req.body), 'Batch submitted')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async validateRichMenuBatch(req, res) {
    try {
      if (!req.body.operations) return fail(res, 'operations is required')
      return ok(res, await richMenuService.validateRichMenuBatchRequest(organizationIdFor(req), req.body), 'Batch request is valid')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async getRichMenuBatchProgress(req, res) {
    try {
      return ok(res, await richMenuService.getRichMenuBatchProgress(organizationIdFor(req), req.params.requestId))
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
}
