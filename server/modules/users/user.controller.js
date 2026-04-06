const BaseController = require('../../core/BaseController')
const userService = require('./user.service')

class UserController extends BaseController {
  async create(req, res) {
    try {
      const user = await userService.create(req.body)
      return this.created(res, { user }, 'User created')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async list(req, res) {
    try {
      const { page, limit, search } = req.query
      const result = await userService.list({ page: +page || 1, limit: +limit || 20, search: search || '' })
      return this.ok(res, result)
    } catch (err) {
      return this.serverError(res)
    }
  }

  async getById(req, res) {
    try {
      const user = await userService.getById(req.params.id)
      return this.ok(res, { user })
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async update(req, res) {
    try {
      const user = await userService.update(req.params.id, req.body)
      return this.ok(res, { user }, 'User updated')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async remove(req, res) {
    try {
      await userService.remove(req.params.id)
      return this.ok(res, null, 'User deleted')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async assignModules(req, res) {
    try {
      const user = await userService.assignModules(req.params.id, req.body.moduleIds || [])
      return this.ok(res, { user }, 'Modules assigned')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async assignRoles(req, res) {
    try {
      const user = await userService.assignRoles(req.params.id, req.body.roleIds || [])
      return this.ok(res, { user }, 'Roles assigned')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async myModules(req, res) {
    try {
      const modules = await userService.getMyModules(req.user.id)
      return this.ok(res, { modules })
    } catch (err) {
      return this.serverError(res)
    }
  }

  async myPermissions(req, res) {
    try {
      const result = await userService.getUserPermissions(req.user.id)
      return this.ok(res, result)
    } catch (err) {
      return this.serverError(res)
    }
  }
}

module.exports = new UserController()
