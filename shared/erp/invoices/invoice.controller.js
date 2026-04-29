const { ok, created, fail, serverError } = require('../../../server/core/response')
const service = require('./invoice.service')

module.exports = {
  async list(req, res) {
    try {
      const { page, limit, search, status } = req.query
      const result = await service.list({ page: +page || 1, limit: +limit || 20, search: search || '', status: status || '' })
      return ok(res, result)
    } catch (err) {
      return serverError(res)
    }
  },

  async getById(req, res) {
    try {
      const invoice = await service.getById(req.params.id)
      return ok(res, { invoice })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      const invoice = await service.create(req.body)
      return created(res, { invoice }, 'Invoice created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async update(req, res) {
    try {
      const invoice = await service.update(req.params.id, req.body)
      return ok(res, { invoice }, 'Invoice updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async updateStatus(req, res) {
    try {
      const invoice = await service.updateStatus(req.params.id, req.body.status)
      return ok(res, { invoice }, 'Invoice status updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return ok(res, null, 'Invoice deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
