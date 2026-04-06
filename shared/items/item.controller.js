const BaseController = require('../../server/core/BaseController')
const itemService = require('./item.service')

class ItemController extends BaseController {
  async list(req, res) {
    try {
      const { page, limit, search, status } = req.query
      const result = await itemService.list({ page: +page || 1, limit: +limit || 20, search: search || '', status: status || '' })
      return this.ok(res, result)
    } catch (err) {
      return this.serverError(res)
    }
  }

  async getById(req, res) {
    try {
      const item = await itemService.getById(req.params.id)
      return this.ok(res, { item })
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async create(req, res) {
    try {
      const item = await itemService.create(req.body)
      return this.created(res, { item }, 'Item created')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async update(req, res) {
    try {
      const item = await itemService.update(req.params.id, req.body)
      return this.ok(res, { item }, 'Item updated')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async remove(req, res) {
    try {
      await itemService.remove(req.params.id)
      return this.ok(res, null, 'Item deleted')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }
}

module.exports = new ItemController()
