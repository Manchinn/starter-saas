const BaseController = require('../../core/BaseController')
const permissionService = require('./permission.service')

class PermissionController extends BaseController {
  async list(req, res) {
    try {
      return this.ok(res, { permissions: await permissionService.list() })
    } catch (err) {
      return this.serverError(res)
    }
  }

  async create(req, res) {
    try {
      return this.created(res, { permission: await permissionService.create(req.body) }, 'Permission created')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async update(req, res) {
    try {
      return this.ok(res, { permission: await permissionService.update(req.params.id, req.body) }, 'Permission updated')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async remove(req, res) {
    try {
      await permissionService.remove(req.params.id)
      return this.ok(res, null, 'Permission deleted')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }
}

module.exports = new PermissionController()
