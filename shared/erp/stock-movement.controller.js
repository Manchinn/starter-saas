const BaseController = require('../../server/core/BaseController')
const service = require('./stock-movement.service')

class StockMovementController extends BaseController {
  async list(req, res) {
    try {
      const { page, limit, productId, storeId, type } = req.query
      const result = await service.list({ page: +page || 1, limit: +limit || 20, productId: productId || '', storeId: storeId || '', type: type || '' })
      return this.ok(res, result)
    } catch (err) {
      return this.serverError(res)
    }
  }
}

module.exports = new StockMovementController()
