const { ok, serverError } = require('../../../server/core/response')
const { orgIdOf } = require('../../../server/core/tenant')
const statsSvc = require('../services/stats.service')

const ctxUser = (req) => ({ id: req.user.id, organizationId: orgIdOf(req) })

module.exports = {
  async tokens(req, res) {
    try {
      return ok(res, await statsSvc.tokenStats(ctxUser(req)))
    } catch (err) {
      return serverError(res)
    }
  },
}
