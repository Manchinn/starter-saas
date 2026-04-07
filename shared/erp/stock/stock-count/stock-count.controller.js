const BaseController = require('../../../../server/core/BaseController')
const service = require('./stock-count.service')

class StockCountController extends BaseController {
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
      const sc = await service.getById(req.params.id)
      return this.ok(res, { stockCount: sc })
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async getStoreProducts(req, res) {
    try {
      const { storeId } = req.query
      if (!storeId) return this.fail(res, 'storeId is required', 400)
      const products = await service.getStoreProducts(storeId)
      return this.ok(res, { products })
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async create(req, res) {
    try {
      const sc = await service.create({ ...req.body, userId: req.user?.id })
      return this.created(res, { stockCount: sc }, 'Stock Count created')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async confirm(req, res) {
    try {
      const sc = await service.confirm(req.params.id)
      return this.ok(res, { stockCount: sc }, 'Stock Count confirmed')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return this.ok(res, null, 'Stock Count deleted')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }
}

module.exports = new StockCountController()
