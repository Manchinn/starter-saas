const { ok, serverError } = require('../../../server/core/response')
const service = require('./dashboard.service')

module.exports = {
  async stats(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const { from, to } = req.query
      const data = await service.getStats(orgId, from, to)
      return ok(res, data)
    } catch (err) {
      return serverError(res)
    }
  },
}
