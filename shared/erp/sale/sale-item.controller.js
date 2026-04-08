const BaseController = require('../../../server/core/BaseController')
const service = require('./sale-item.service')

class SaleItemController extends BaseController {
  async list(req, res) {
    try {
      const { page, limit, search, status } = req.query
      const result = await service.list({
        page:   +page   || 1,
        limit:  +limit  || 20,
        search: search  || '',
        status: status  || '',
      })
      return this.ok(res, result)
    } catch (err) {
      return this.serverError(res)
    }
  }

  async getById(req, res) {
    try {
      const item = await service.getById(req.params.id)
      return this.ok(res, { item })
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async create(req, res) {
    try {
      const item = await service.create({ ...req.body, userId: req.user?.id })
      return this.created(res, { item }, 'Sale item created')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async update(req, res) {
    try {
      const item = await service.update(req.params.id, req.body)
      return this.ok(res, { item }, 'Sale item updated')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return this.ok(res, null, 'Sale item deleted')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }
}

module.exports = new SaleItemController()
