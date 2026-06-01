const { ok, fail, serverError } = require('../../../server/core/response')
const { orgIdOf } = require('../../../server/core/tenant')
const settingsSvc = require('../services/settings.service')
const provider = require('../services/provider.service')

module.exports = {
  async get(req, res) {
    try {
      return ok(res, await settingsSvc.get(req.user.id, orgIdOf(req)))
    } catch (err) {
      return serverError(res)
    }
  },

  async update(req, res) {
    try {
      const saved = await settingsSvc.save(req.user.id, orgIdOf(req), req.body || {})
      return ok(res, saved, 'Settings saved')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  // Connection test — lists models from the (possibly unsaved) connection in
  // the query, falling back to the user's saved settings.
  async models(req, res) {
    try {
      const saved = await settingsSvc.getRaw(req.user.id, orgIdOf(req))
      const provName = req.query.provider || saved.provider
      const baseUrl = req.query.baseUrl || saved.baseUrl
      const apiKey = req.query.apiKey || saved.apiKey
      const models = await provider.listModels({ provider: provName, baseUrl, apiKey })
      return ok(res, { models })
    } catch (err) {
      return fail(res, err.message || 'Could not reach the LLM', err.status || 502)
    }
  },
}
