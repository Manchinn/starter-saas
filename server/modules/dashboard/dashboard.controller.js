const BaseController = require('../../core/BaseController')
const { User, Module } = require('../../models')

class DashboardController extends BaseController {
  async stats(req, res) {
    try {
      const [totalUsers, totalModules, activeModules] = await Promise.all([
        User.count(),
        Module.count(),
        Module.count({ where: { isActive: true } }),
      ])
      return this.ok(res, { totalUsers, totalModules, activeModules })
    } catch (err) {
      return this.serverError(res)
    }
  }
}

module.exports = new DashboardController()
