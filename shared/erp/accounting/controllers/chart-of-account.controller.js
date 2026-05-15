const { ok, created, fail, serverError } = require('../../../../server/core/response')
const service = require('../services/chart-of-account.service')

module.exports = {
  async list(req, res) {
    try {
      const { page, limit, search, accountType, status } = req.query
      const orgId = req.user?.organizationId || req.user?.id
      const result = await service.list({ page: +page || 1, limit: +limit || 20, search: search || '', accountType: accountType || '', status: status || '', organizationId: orgId })
      return ok(res, result)
    } catch (err) {
      return serverError(res)
    }
  },

  async listAll(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const accounts = await service.listAll(orgId)
      return ok(res, { accounts })
    } catch (err) {
      return serverError(res)
    }
  },

  async getById(req, res) {
    try {
      const account = await service.getById(req.params.id)
      return ok(res, { account })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const account = await service.create({ ...req.body, userId: req.user?.id, organizationId: orgId })
      return created(res, { account }, 'Account created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async update(req, res) {
    try {
      const account = await service.update(req.params.id, req.body, req.user?.id)
      return ok(res, { account }, 'Account updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return ok(res, null, 'Account deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
