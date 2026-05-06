const { ok, created, fail, serverError } = require('../../../../server/core/response')
const service = require('./stock-issue.service')

module.exports = {
  async list(req, res) {
    try {
      const { page, limit, search } = req.query
      const orgId = req.user?.organizationId || req.user?.id
      const result = await service.list({ page: +page || 1, limit: +limit || 20, search: search || '', organizationId: orgId })
      return ok(res, result)
    } catch (err) {
      return serverError(res)
    }
  },

  async getById(req, res) {
    try {
      const issue = await service.getById(req.params.id)
      return ok(res, { issue })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const issue = await service.create({ ...req.body, userId: req.user?.id, organizationId: orgId })
      return created(res, { issue }, 'Stock Issue created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async confirm(req, res) {
    try {
      const issue = await service.confirm(req.params.id)
      return ok(res, { issue }, 'Stock Issue confirmed')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return ok(res, null, 'Stock Issue deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
