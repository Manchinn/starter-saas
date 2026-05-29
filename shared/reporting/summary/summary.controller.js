const { ok, serverError } = require('../../../server/core/response')
const service = require('./summary.service')

module.exports = {
  async erp(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const { from, to } = req.query
      const data = await service.getSummary(orgId, { from, to })
      return ok(res, data)
    } catch (err) {
      return serverError(res)
    }
  },
}
