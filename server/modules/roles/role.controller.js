const { ok, created, fail, serverError } = require('../../core/response')
const roleService = require('./role.service')

module.exports = {
  async list(req, res) {
    try {
      return ok(res, { roles: await roleService.list() })
    } catch (err) {
      return serverError(res)
    }
  },

  async getById(req, res) {
    try {
      return ok(res, { role: await roleService.getById(req.params.id) })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      return created(res, { role: await roleService.create(req.body) }, 'Role created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async update(req, res) {
    try {
      return ok(res, { role: await roleService.update(req.params.id, req.body) }, 'Role updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      await roleService.remove(req.params.id)
      return ok(res, null, 'Role deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async assignPermissions(req, res) {
    try {
      const role = await roleService.assignPermissions(req.params.id, req.body.permissionIds || [])
      return ok(res, { role }, 'Permissions assigned')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async assignModules(req, res) {
    try {
      const role = await roleService.assignModules(req.params.id, req.body.moduleIds || [])
      return ok(res, { role }, 'Modules assigned')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
