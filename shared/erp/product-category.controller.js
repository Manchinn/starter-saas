const BaseController = require('../../server/core/BaseController')
const service = require('./product-category.service')

class ProductCategoryController extends BaseController {
  async listAll(req, res) {
    try {
      const categories = await service.listAll()
      return this.ok(res, { categories })
    } catch (err) {
      return this.serverError(res)
    }
  }

  async list(req, res) {
    try {
      const { page, limit, search } = req.query
      const result = await service.list({ page: +page || 1, limit: +limit || 20, search: search || '' })
      return this.ok(res, result)
    } catch (err) {
      return this.serverError(res)
    }
  }

  async getById(req, res) {
    try {
      const category = await service.getById(req.params.id)
      return this.ok(res, { category })
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async create(req, res) {
    try {
      const category = await service.create(req.body)
      return this.created(res, { category }, 'Product category created')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async update(req, res) {
    try {
      const category = await service.update(req.params.id, req.body)
      return this.ok(res, { category }, 'Product category updated')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return this.ok(res, null, 'Product category deleted')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }
}

module.exports = new ProductCategoryController()
