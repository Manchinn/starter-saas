const { ok, fail, serverError } = require('../../../server/core/response')
const service         = require('./demo-data.service')
const sequenceService = require('./sequence.service')
const logger          = require('../../../server/core/logger').forLabel('demo-data')

module.exports = {
  async seed(req, res) {
    try {
      const orgId = req.user.organizationId || req.user.id
      const result = await service.seedDemo(req.user?.id, orgId)
      return ok(res, result, result.message)
    } catch (err) {
      logger.error('seed error', { error: err.message, stack: err.stack })
      return fail(res, err.message || 'Failed to seed demo data', 400)
    }
  },

  async seedSequences(req, res) {
    try {
      const result = await sequenceService.seedDefaultsForUser(req.user.id)
      return ok(res, result, result.seeded ? `Seeded ${result.count} sequences` : 'Sequences already exist')
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
