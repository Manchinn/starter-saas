const { ok, created, fail, serverError } = require('../../../server/core/response')
const service = require('./store.service')

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

  async getById(req, res) {
    try {
      const store = await service.getById(req.params.id)
      return ok(res, { store })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      const store = await service.create({ ...req.body, userId: req.user?.id })
      return created(res, { store }, 'Store created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async update(req, res) {
    try {
      const store = await service.update(req.params.id, req.body, req.user?.id)
      return ok(res, { store }, 'Store updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return ok(res, null, 'Store deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
