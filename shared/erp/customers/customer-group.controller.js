const BaseController = require('../../../server/core/BaseController')
const service = require('./customer-group.service')

class CustomerGroupController extends BaseController {
  async list(req, res) {
    try {
      const { page, limit, search } = req.query
      const result = await service.list({ page: +page || 1, limit: +limit || 20, search: search || '' })
      return this.ok(res, result)
    } catch (err) {
      return this.serverError(res)
    }
  }

  async listAll(req, res) {
    try {
      const groups = await service.listAll()
      return this.ok(res, { groups })
    } catch (err) {
      return this.serverError(res)
    }
  }

  async getById(req, res) {
    try {
      const group = await service.getById(req.params.id)
      return this.ok(res, { group })
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async create(req, res) {
    try {
      const group = await service.create(req.body)
      return this.created(res, { group }, 'Customer group created')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async update(req, res) {
    try {
      const group = await service.update(req.params.id, req.body)
      return this.ok(res, { group }, 'Customer group updated')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return this.ok(res, null, 'Customer group deleted')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }
}

module.exports = new CustomerGroupController()
