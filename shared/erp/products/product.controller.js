const { ok, created, fail, serverError } = require('../../../server/core/response')
const service = require('./product.service')

module.exports = {
  async listStores(req, res) {
    try {
      const stores = await service.listStores()
      return ok(res, { stores })
    } catch (err) {
      return serverError(res)
    }
  },

  async listStoreStocks(req, res) {
    try {
      const result = await service.listStoreStocks(req.params.id)
      return ok(res, result)
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async list(req, res) {
    try {
      const { page, limit, search } = req.query
      const result = await service.list({ page: +page || 1, limit: +limit || 20, search: search || '', createdBy: req.user?.id })
      return ok(res, result)
    } catch (err) {
      return serverError(res)
    }
  },

  async getById(req, res) {
    try {
      const product = await service.getById(req.params.id)
      return ok(res, { product })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      const product = await service.create({ ...req.body, userId: req.user?.id })
      return created(res, { product }, 'Product created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async update(req, res) {
    try {
      const product = await service.update(req.params.id, req.body, req.user?.id)
      return ok(res, { product }, 'Product updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return ok(res, null, 'Product deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
