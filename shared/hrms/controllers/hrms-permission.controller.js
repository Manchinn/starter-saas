const { ok, serverError } = require('../../../server/core/response')
const service = require('../services/hrms-permission.service')

module.exports = {
  async list(req, res) {
    try {
      return ok(res, { permissions: await service.list() })
    } catch (err) {
      return serverError(res)
    }
  },
}
