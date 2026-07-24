const { ok, fail, serverError } = require('../../../../server/core/response')
const service         = require('../services/demo-data.service')
const sequenceService = require('../services/sequence.service')
const logger          = require('../../../../server/core/logger').forLabel('demo-data')

module.exports = {
  async seed(req, res) {
    try {
      const orgId = req.user.organizationId || req.user.id
      const lang = ['en', 'th'].includes(req.body?.lang) ? req.body.lang : 'en'
      const result = await service.seedDemo(req.user?.id, orgId, lang)
      return ok(res, result, result.message)
    } catch (err) {
      logger.error('seed error', { error: err.message, stack: err.stack })
      if (err.name === 'SequelizeUniqueConstraintError') {
        return fail(res, 'Demo data conflicts with existing records. Reset ERP data or remove conflicting records before seeding.', 409)
      }
      return fail(res, err.message || 'Failed to seed demo data', err.status || 400)
    }
  },

  async seedSequences(req, res) {
    try {
      const result = await sequenceService.seedDefaultsForUser(req.user.id)
      const msg = result.seeded
        ? `Seeded ${result.added} new sequence${result.added === 1 ? '' : 's'}` + (result.skipped ? ` (${result.skipped} already existed)` : '')
        : 'All default sequences already exist'
      return ok(res, result, msg)
    } catch (err) {
      logger.error('seed-sequences error', { error: err.message, stack: err.stack })
      return serverError(res, 'Failed to seed sequences')
    }
  },

  async reset(req, res) {
    try {
      const result = await service.resetAll()
      return ok(res, result, result.message)
    } catch (err) {
      logger.error('reset error', { error: err.message, stack: err.stack })
      return serverError(res, 'Failed to reset data')
    }
  },
}
