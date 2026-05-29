const { ok, serverError } = require('../../../server/core/response')
const service = require('./summary.service')

module.exports = {
  async erp(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const data = await service.getSummary(orgId)
      return ok(res, data)
    } catch (err) {
      return serverError(res)
    }
  },
}
