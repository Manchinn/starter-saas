const { ok, created, fail, serverError } = require('../../../server/core/response')
const service = require('./product-category.service')

module.exports = {
  async listAll(req, res) {
    try {
      const categories = await service.listAll()
      return ok(res, { categories })
    } catch (err) {
      return serverError(res)
    }
  },

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
      const category = await service.getById(req.params.id)
      return ok(res, { category })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      const category = await service.create({ ...req.body, userId: req.user?.id })
      return created(res, { category }, 'Product category created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async update(req, res) {
    try {
      const category = await service.update(req.params.id, req.body, req.user?.id)
      return ok(res, { category }, 'Product category updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return ok(res, null, 'Product category deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
