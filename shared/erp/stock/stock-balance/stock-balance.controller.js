const { ok, fail, serverError } = require('../../../../server/core/response')
const service = require('../stock-balance/stock-balance.service')

module.exports = {
  async list(req, res) {
    try {
      const { storeId, productId, includeZero } = req.query
      const rows = await service.list({ storeId: storeId || '', productId: productId || '', includeZero: includeZero === 'true' })
      return ok(res, { balances: rows, total: rows.length })
    } catch (err) {
      return serverError(res)
    }
  },

  async lookups(req, res) {
    try {
      const data = await service.lookups()
      return ok(res, data)
    } catch (err) {
      return serverError(res)
    }
  },

  async getProductSummary(req, res) {
    try {
      const result = await service.getProductSummary(req.params.productId)
      return ok(res, result)
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
