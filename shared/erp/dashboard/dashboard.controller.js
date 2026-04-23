const { ok, serverError } = require('../../../server/core/response')
const service = require('./dashboard.service')

module.exports = {
  async stats(req, res) {
    try {
      const data = await service.getStats()
      return ok(res, data)
    } catch (err) {
      return serverError(res)
    }
  },
}
