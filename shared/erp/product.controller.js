const BaseController = require('../../server/core/BaseController')
const service = require('./product.service')

class ProductController extends BaseController {
  async listStores(req, res) {
    try {
      const stores = await service.listStores()
      return this.ok(res, { stores })
    } catch (err) {
      return this.serverError(res)
    }
  }

  async listStoreStocks(req, res) {
    try {
      const result = await service.listStoreStocks(req.params.id)
      return this.ok(res, result)
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
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
      const product = await service.getById(req.params.id)
      return this.ok(res, { product })
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async create(req, res) {
    try {
      const product = await service.create(req.body)
      return this.created(res, { product }, 'Product created')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async update(req, res) {
    try {
      const product = await service.update(req.params.id, req.body)
      return this.ok(res, { product }, 'Product updated')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return this.ok(res, null, 'Product deleted')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }
}

module.exports = new ProductController()
