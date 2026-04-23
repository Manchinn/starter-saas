const { ok, created, fail, serverError } = require('../../../server/core/response')
const service = require('./employee.service')

module.exports = {
  async list(req, res) {
    try {
      const { page, limit, search, status } = req.query
      const organizationId = req.user.organizationId || req.user.id
      const result = await service.list({ organizationId, page: +page || 1, limit: +limit || 20, search: search || '', status: status || '' })
      return ok(res, result)
    } catch (err) {
      return serverError(res)
    }
  },

  async getById(req, res) {
    try {
      const organizationId = req.user.organizationId || req.user.id
      const emp = await service.getById(req.params.id, organizationId)
      return ok(res, { employee: emp })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      const organizationId = req.user.organizationId || req.user.id
      const emp = await service.create({ ...req.body, createdByUserId: req.user?.id, organizationId })
      return created(res, { employee: emp }, 'Employee created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async update(req, res) {
    try {
      const organizationId = req.user.organizationId || req.user.id
      const emp = await service.update(req.params.id, req.body, organizationId)
      return ok(res, { employee: emp }, 'Employee updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      const organizationId = req.user.organizationId || req.user.id
      await service.remove(req.params.id, organizationId)
      return ok(res, null, 'Employee deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
