const BaseController = require('../../server/core/BaseController')
const service = require('./stock-request.service')

class StockRequestController extends BaseController {
  async list(req, res) {
    try {
      const { page, limit, search } = req.query
      const result = await service.list({ page: +page || 1, limit: +limit || 20, search: search || '' })
      return this.ok(res, result)
    } catch (err) {
      return this.serverError(res)
    }
  }

  async getById(req, res) {
    try {
      const request = await service.getById(req.params.id)
      return this.ok(res, { request })
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async create(req, res) {
    try {
      const request = await service.create(req.body)
      return this.created(res, { request }, 'Stock Request created')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async confirm(req, res) {
    try {
      const request = await service.confirm(req.params.id)
      return this.ok(res, { request }, 'Stock Request confirmed')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return this.ok(res, null, 'Stock Request deleted')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }
}

module.exports = new StockRequestController()
