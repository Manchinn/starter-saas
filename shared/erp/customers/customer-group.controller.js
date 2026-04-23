const { ok, created, fail, serverError } = require('../../../server/core/response')
const service = require('./customer-group.service')

module.exports = {
  async list(req, res) {
    try {
      const { page, limit, search } = req.query
      const result = await service.list({ page: +page || 1, limit: +limit || 20, search: search || '' })
      return ok(res, result)
    } catch (err) {
      return serverError(res)
    }
  },

  async listAll(req, res) {
    try {
      const groups = await service.listAll()
      return ok(res, { groups })
    } catch (err) {
      return serverError(res)
    }
  },

  async getById(req, res) {
    try {
      const group = await service.getById(req.params.id)
      return ok(res, { group })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      const group = await service.create(req.body)
      return created(res, { group }, 'Customer group created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async update(req, res) {
    try {
      const group = await service.update(req.params.id, req.body)
      return ok(res, { group }, 'Customer group updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return ok(res, null, 'Customer group deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
