const BaseController = require('../../core/BaseController')
const roleService = require('./role.service')

class RoleController extends BaseController {
  async list(req, res) {
    try {
      return this.ok(res, { roles: await roleService.list() })
    } catch (err) {
      return this.serverError(res)
    }
  }

  async getById(req, res) {
    try {
      return this.ok(res, { role: await roleService.getById(req.params.id) })
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async create(req, res) {
    try {
      return this.created(res, { role: await roleService.create(req.body) }, 'Role created')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async update(req, res) {
    try {
      return this.ok(res, { role: await roleService.update(req.params.id, req.body) }, 'Role updated')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async remove(req, res) {
    try {
      await roleService.remove(req.params.id)
      return this.ok(res, null, 'Role deleted')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async assignPermissions(req, res) {
    try {
      const role = await roleService.assignPermissions(req.params.id, req.body.permissionIds || [])
      return this.ok(res, { role }, 'Permissions assigned')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async assignModules(req, res) {
    try {
      const role = await roleService.assignModules(req.params.id, req.body.moduleIds || [])
      return this.ok(res, { role }, 'Modules assigned')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }
}

module.exports = new RoleController()
