const { ok, created, fail, serverError } = require('../../../../server/core/response')
const service = require('./stock-request.service')

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
      const request = await service.getById(req.params.id)
      return ok(res, { request })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const request = await service.create({ ...req.body, userId: req.user?.id, organizationId: orgId })
      return created(res, { request }, 'Stock Transfer created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async update(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const request = await service.update(req.params.id, { ...req.body, userId: req.user?.id, organizationId: orgId })
      return ok(res, { request }, 'Stock Transfer updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async confirm(req, res) {
    try {
      const request = await service.confirm(req.params.id)
      return ok(res, { request }, 'Stock Transfer confirmed')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return ok(res, null, 'Stock Transfer deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
