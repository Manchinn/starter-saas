const BaseController = require('../../core/BaseController')
const moduleService = require('./module.service')

class ModuleController extends BaseController {
  async list(req, res) {
    try {
      const modules = await moduleService.list()
      return this.ok(res, { modules })
    } catch (err) {
      return this.serverError(res)
    }
  }

  async getById(req, res) {
    try {
      const mod = await moduleService.getById(req.params.id)
      return this.ok(res, { module: mod })
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async create(req, res) {
    try {
      const mod = await moduleService.create(req.body)
      return this.created(res, { module: mod }, 'Module created')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async update(req, res) {
    try {
      const mod = await moduleService.update(req.params.id, req.body)
      return this.ok(res, { module: mod }, 'Module updated')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async toggle(req, res) {
    try {
      const mod = await moduleService.toggle(req.params.id)
      return this.ok(res, { module: mod }, `Module ${mod.isActive ? 'activated' : 'deactivated'}`)
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async remove(req, res) {
    try {
      await moduleService.remove(req.params.id)
      return this.ok(res, null, 'Module deleted')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }
}

module.exports = new ModuleController()
