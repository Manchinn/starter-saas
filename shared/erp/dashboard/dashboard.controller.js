const { ok, serverError } = require('../../../server/core/response')
const service = require('./dashboard.service')

module.exports = {
  async stats(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const data = await service.getStats(orgId)
      return ok(res, data)
    } catch (err) {
      return serverError(res)
    }
  },
}
