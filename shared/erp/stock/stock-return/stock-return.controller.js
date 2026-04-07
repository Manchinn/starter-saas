const BaseController = require('../../../../server/core/BaseController')
const service = require('./stock-return.service')

class StockReturnController extends BaseController {
  async list(req, res) {
    try {
      const { page, limit, search, type } = req.query
      const result = await service.list({ page: +page || 1, limit: +limit || 20, search: search || '', type: type || '' })
      return this.ok(res, result)
    } catch (err) {
      return this.serverError(res)
    }
  }

  async getById(req, res) {
    try {
      const sr = await service.getById(req.params.id)
      return this.ok(res, { stockReturn: sr })
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async create(req, res) {
    try {
      const sr = await service.create({ ...req.body, userId: req.user?.id })
      return this.created(res, { stockReturn: sr }, 'Stock Return created')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async confirm(req, res) {
    try {
      const sr = await service.confirm(req.params.id)
      return this.ok(res, { stockReturn: sr }, 'Stock Return confirmed')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return this.ok(res, null, 'Stock Return deleted')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }
}

module.exports = new StockReturnController()
