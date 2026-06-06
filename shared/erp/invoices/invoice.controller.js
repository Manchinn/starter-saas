const { ok, created, fail, serverError } = require('../../../server/core/response')
const service = require('./invoice.service')

module.exports = {
  async list(req, res) {
    try {
      const { page, limit, search, status, dateFrom, dateTo } = req.query
      const orgId = req.user?.organizationId || req.user?.id
      const result = await service.list({
        page: +page || 1, limit: +limit || 20,
        search: search || '', status: status || '',
        dateFrom: dateFrom || '', dateTo: dateTo || '',
        organizationId: orgId,
      })
      return ok(res, result)
    } catch (err) {
      return serverError(res)
    }
  },

  async getById(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const invoice = await service.getById(req.params.id, orgId)
      return ok(res, { invoice })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const invoice = await service.create({ ...req.body, userId: req.user?.id, organizationId: orgId })
      return created(res, { invoice }, 'Invoice created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async update(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const invoice = await service.update(req.params.id, req.body, req.user?.id, orgId)
      return ok(res, { invoice }, 'Invoice updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async updateStatus(req, res) {
    try {
      res.locals.skipAudit = true // service emits a rich invoice.<status> event
      const orgId = req.user?.organizationId || req.user?.id
      const invoice = await service.updateStatus(req.params.id, req.body.status, req.user?.id, orgId)
      return ok(res, { invoice }, 'Invoice status updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      await service.remove(req.params.id, orgId)
      return ok(res, null, 'Invoice deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async createReceipt(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const result = await service.createReceipt(req.params.id, req.user?.id, orgId)
      return created(res, result, 'Receipt created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
