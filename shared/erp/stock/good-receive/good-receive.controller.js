const { ok, created, fail, serverError } = require('../../../../server/core/response')
const service = require('./good-receive.service')

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
      const gr = await service.getById(req.params.id)
      return ok(res, { goodReceive: gr })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const gr = await service.create({ ...req.body, userId: req.user?.id, organizationId: orgId })
      return created(res, { goodReceive: gr }, 'Good Receive created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async confirm(req, res) {
    try {
      const gr = await service.confirm(req.params.id)
      return ok(res, { goodReceive: gr }, 'Good Receive confirmed')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return ok(res, null, 'Good Receive deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async createBill(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const result = await service.createBill(req.params.id, req.user?.id, orgId)
      return created(res, result, 'Vendor bill created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
