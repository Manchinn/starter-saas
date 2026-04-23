const { ok, created, fail, serverError } = require('../../../server/core/response')
const service = require('./customer.service')

module.exports = {
  async list(req, res) {
    try {
      const { page, limit, search, groupId } = req.query
      const result = await service.list({ page: +page || 1, limit: +limit || 20, search: search || '', groupId: groupId || '' })
      return ok(res, result)
    } catch (err) {
      return serverError(res)
    }
  },

  async getById(req, res) {
    try {
      const customer = await service.getById(req.params.id)
      return ok(res, { customer })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      const customer = await service.create({ ...req.body, userId: req.user?.id })
      return created(res, { customer }, 'Customer created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async update(req, res) {
    try {
      const customer = await service.update(req.params.id, req.body)
      return ok(res, { customer }, 'Customer updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return ok(res, null, 'Customer deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
