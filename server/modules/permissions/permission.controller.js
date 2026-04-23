const { ok, created, fail, serverError } = require('../../core/response')
const permissionService = require('./permission.service')

module.exports = {
  async list(req, res) {
    try {
      return ok(res, { permissions: await permissionService.list() })
    } catch (err) {
      return serverError(res)
    }
  },

  async create(req, res) {
    try {
      return created(res, { permission: await permissionService.create(req.body) }, 'Permission created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async update(req, res) {
    try {
      return ok(res, { permission: await permissionService.update(req.params.id, req.body) }, 'Permission updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      await permissionService.remove(req.params.id)
      return ok(res, null, 'Permission deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
