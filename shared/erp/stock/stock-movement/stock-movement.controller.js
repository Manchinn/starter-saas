const { ok, serverError } = require('../../../../server/core/response')
const service = require('./stock-movement.service')

module.exports = {
  async list(req, res) {
    try {
      const { page, limit, productId, storeId, type } = req.query
      const result = await service.list({ page: +page || 1, limit: +limit || 20, productId: productId || '', storeId: storeId || '', type: type || '' })
      return ok(res, result)
    } catch (err) {
      return serverError(res)
    }
  },
}
