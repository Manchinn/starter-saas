const { ok, serverError } = require('../../../server/core/response')
const { resolvePermissions } = require('../../../server/middleware/permission')
const service = require('./dashboard.service')

module.exports = {
  async stats(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const { from, to } = req.query
      // Only compute the sections this user is permitted to see. System admins
      // resolve to a '*' wildcard set (full dashboard); employees see the
      // sections granted by their HRMS-role permissions.
      const permissions = await resolvePermissions(req.user)
      const data = await service.getStats(orgId, from, to, permissions)
      return ok(res, data)
    } catch (err) {
      return serverError(res)
    }
  },
}
