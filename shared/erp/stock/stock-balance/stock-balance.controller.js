const BaseController = require('../../../../server/core/BaseController')
const service = require('../stock-balance/stock-balance.service')

class StockBalanceController extends BaseController {
  async list(req, res) {
    try {
      const { storeId, productId, includeZero } = req.query
      const rows = await service.list({
        storeId:     storeId     || '',
        productId:   productId   || '',
        includeZero: includeZero === 'true',
      })
      return this.ok(res, { balances: rows, total: rows.length })
    } catch (err) {
      return this.serverError(res)
    }
  }

  async lookups(req, res) {
    try {
      const data = await service.lookups()
      return this.ok(res, data)
    } catch (err) {
      return this.serverError(res)
    }
  }

  async getProductSummary(req, res) {
    try {
      const result = await service.getProductSummary(req.params.productId)
      return this.ok(res, result)
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }
}

module.exports = new StockBalanceController()
