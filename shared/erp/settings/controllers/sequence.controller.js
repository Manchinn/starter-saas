const { ok, created, fail, serverError } = require('../../../../server/core/response')
const service = require('../services/sequence.service')

module.exports = {
  async list(req, res) {
    try {
      const rows = await service.list(req.user?.id)
      return ok(res, { sequences: rows })
    } catch (err) {
      return serverError(res)
    }
  },

  async getById(req, res) {
    try {
      const seq = await service.getById(req.params.id)
      return ok(res, { sequence: seq })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      const seq = await service.create(req.body, req.user?.id)
      return created(res, { sequence: seq }, 'Sequence created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async update(req, res) {
    try {
      const seq = await service.update(req.params.id, req.body)
      return ok(res, { sequence: seq }, 'Sequence updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async reset(req, res) {
    try {
      const seq = await service.resetSequence(req.params.id)
      return ok(res, { sequence: seq }, 'Sequence reset to initial value')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return ok(res, null, 'Sequence deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
