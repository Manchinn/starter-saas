const BaseController = require('../../../server/core/BaseController')
const service = require('./pricing.service')

class PricingController extends BaseController {
  async list(req, res) {
    try {
      const { page, limit, search, status, customerGroupId } = req.query
      const result = await service.list({ page: +page || 1, limit: +limit || 20, search: search || '', status: status || '', customerGroupId: customerGroupId || '' })
      return this.ok(res, result)
    } catch (err) {
      return this.serverError(res)
    }
  }

  async getById(req, res) {
    try {
      const pricing = await service.getById(req.params.id)
      return this.ok(res, { pricing })
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async create(req, res) {
    try {
      const pricing = await service.create({ ...req.body, userId: req.user?.id })
      return this.created(res, { pricing }, 'Pricing created')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async update(req, res) {
    try {
      const pricing = await service.update(req.params.id, req.body, req.user?.id)
      return this.ok(res, { pricing }, 'Pricing updated')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return this.ok(res, null, 'Pricing deleted')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async applyToOrderItems(req, res) {
    try {
      const result = await service.applyToOrderItems(req.params.id, req.body.orderItemIds || [])
      return this.ok(res, result, `Pricing applied to ${result.applied} order item(s)`)
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async listOrderItems(req, res) {
    try {
      const { search, draftOnly } = req.query
      const items = await service.listOrderItems({ search: search || '', draftOnly: draftOnly === 'true' })
      return this.ok(res, { orderItems: items })
    } catch (err) {
      return this.serverError(res)
    }
  }
}

module.exports = new PricingController()
