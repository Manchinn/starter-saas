const { ok, created, fail, serverError } = require('../../../../server/core/response')
const service = require('../services/customer.service')

module.exports = {
  async list(req, res) {
    try {
      const { page, limit, search, groupId, status, activeFrom, activeTo } = req.query
      const orgId = req.user?.organizationId || req.user?.id
      const result = await service.list({ page: +page || 1, limit: +limit || 20, search: search || '', groupId: groupId || '', status: status || '', activeFrom: activeFrom || '', activeTo: activeTo || '', organizationId: orgId })
      return ok(res, result)
    } catch (err) {
      return serverError(res)
    }
  },

  async getById(req, res) {
    try {
      const customer = await service.getById(req.params.id)
      return ok(res, { customer })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const customer = await service.create({ ...req.body, userId: req.user?.id, organizationId: orgId })
      return created(res, { customer }, 'Customer created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async update(req, res) {
    try {
      const customer = await service.update(req.params.id, req.body, req.user?.id)
      return ok(res, { customer }, 'Customer updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return ok(res, null, 'Customer deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
