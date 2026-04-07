const BaseController = require('../../../server/core/BaseController')
const service = require('./store.service')

class StoreController extends BaseController {
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
      const store = await service.getById(req.params.id)
      return this.ok(res, { store })
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async create(req, res) {
    try {
      const store = await service.create({ ...req.body, userId: req.user?.id })
      return this.created(res, { store }, 'Store created')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async update(req, res) {
    try {
      const store = await service.update(req.params.id, req.body, req.user?.id)
      return this.ok(res, { store }, 'Store updated')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return this.ok(res, null, 'Store deleted')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }
}

module.exports = new StoreController()
