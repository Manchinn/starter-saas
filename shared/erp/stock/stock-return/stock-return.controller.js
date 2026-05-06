const { ok, created, fail, serverError } = require('../../../../server/core/response')
const service = require('./stock-return.service')

module.exports = {
  async list(req, res) {
    try {
      const { page, limit, search, type } = req.query
      const orgId = req.user?.organizationId || req.user?.id
      const result = await service.list({ page: +page || 1, limit: +limit || 20, search: search || '', type: type || '', organizationId: orgId })
      return ok(res, result)
    } catch (err) {
      return serverError(res)
    }
  },

  async getById(req, res) {
    try {
      const sr = await service.getById(req.params.id)
      return ok(res, { stockReturn: sr })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const sr = await service.create({ ...req.body, userId: req.user?.id, organizationId: orgId })
      return created(res, { stockReturn: sr }, 'Stock Return created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async confirm(req, res) {
    try {
      const sr = await service.confirm(req.params.id)
      return ok(res, { stockReturn: sr }, 'Stock Return confirmed')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return ok(res, null, 'Stock Return deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
