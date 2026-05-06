const { ok, created, fail, serverError } = require('../../../server/core/response')
const service = require('./sale-item.service')

module.exports = {
  async list(req, res) {
    try {
      const { page, limit, search, status } = req.query
      const orgId = req.user?.organizationId || req.user?.id
      const result = await service.list({ page: +page || 1, limit: +limit || 20, search: search || '', status: status || '', organizationId: orgId })
      return ok(res, result)
    } catch (err) {
      return serverError(res)
    }
  },

  async getById(req, res) {
    try {
      const item = await service.getById(req.params.id)
      return ok(res, { item })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const item = await service.create({ ...req.body, userId: req.user?.id, organizationId: orgId })
      return created(res, { item }, 'Sale item created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async update(req, res) {
    try {
      const item = await service.update(req.params.id, req.body, req.user?.id)
      return ok(res, { item }, 'Sale item updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return ok(res, null, 'Sale item deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
