const { ok, created, fail, serverError } = require('../../../../server/core/response')
const service = require('../services/sale-package.service')

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
      const orgId = req.user?.organizationId || req.user?.id
      const pkg = await service.getById(req.params.id, orgId)
      return ok(res, { package: pkg })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const pkg = await service.create({ ...req.body, userId: req.user?.id, organizationId: orgId })
      return created(res, { package: pkg }, 'Sale package created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async update(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const pkg = await service.update(req.params.id, req.body, req.user?.id, orgId)
      return ok(res, { package: pkg }, 'Sale package updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      await service.remove(req.params.id, orgId)
      return ok(res, null, 'Sale package deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
