const { ok, created, fail, serverError } = require('../../../server/core/response')
const service = require('./pricing.service')

module.exports = {
  async list(req, res) {
    try {
      const { page, limit, search, status, customerGroupId, activeFrom, activeTo } = req.query
      const orgId = req.user?.organizationId || req.user?.id
      const result = await service.list({ page: +page || 1, limit: +limit || 20, search: search || '', status: status || '', customerGroupId: customerGroupId || '', activeFrom: activeFrom || '', activeTo: activeTo || '', organizationId: orgId })
      return ok(res, result)
    } catch (err) {
      return serverError(res)
    }
  },

  async getById(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const pricing = await service.getById(req.params.id, orgId)
      return ok(res, { pricing })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const pricing = await service.create({ ...req.body, userId: req.user?.id, organizationId: orgId })
      return created(res, { pricing }, 'Pricing created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async update(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const pricing = await service.update(req.params.id, req.body, req.user?.id, orgId)
      return ok(res, { pricing }, 'Pricing updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      await service.remove(req.params.id, orgId)
      return ok(res, null, 'Pricing deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
