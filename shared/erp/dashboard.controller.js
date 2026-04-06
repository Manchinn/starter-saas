const BaseController = require('../../server/core/BaseController')
const service = require('./dashboard.service')

class DashboardController extends BaseController {
  async stats(req, res) {
    try {
      const data = await service.getStats()
      return this.ok(res, data)
    } catch (err) {
      return this.serverError(res)
    }
  }
}

module.exports = new DashboardController()
