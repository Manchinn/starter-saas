const { ok, serverError } = require('../../core/response')
const { User, Module } = require('../../models')

module.exports = {
  async stats(req, res) {
    try {
      const [totalUsers, totalModules, activeModules] = await Promise.all([
        User.count(),
        Module.count(),
        Module.count({ where: { isActive: true } }),
      ])
      return ok(res, { totalUsers, totalModules, activeModules })
    } catch (err) {
      return serverError(res)
    }
  },
}
