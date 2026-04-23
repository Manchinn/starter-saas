const { ok, fail, serverError } = require('../../../server/core/response')
const service = require('./demo-data.service')

module.exports = {
  async seed(req, res) {
    try {
      const result = await service.seedDemo(req.user?.id)
      return ok(res, result, result.message)
    } catch (err) {
      console.error('[demo-data] seed error:', err)
      return fail(res, err.message || 'Failed to seed demo data', 400)
    }
  },

  async reset(req, res) {
    try {
      const result = await service.resetAll()
      return ok(res, result, result.message)
    } catch (err) {
      console.error('[demo-data] reset error:', err)
      return serverError(res, 'Failed to reset data')
    }
  },
}
