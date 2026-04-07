const BaseController = require('../../../server/core/BaseController')
const service = require('./sequence.service')

class SequenceController extends BaseController {
  async list(req, res) {
    try {
      const rows = await service.list(req.user?.id)
      return this.ok(res, { sequences: rows })
    } catch (err) {
      return this.serverError(res)
    }
  }

  async getById(req, res) {
    try {
      const seq = await service.getById(req.params.id)
      return this.ok(res, { sequence: seq })
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async create(req, res) {
    try {
      const seq = await service.create(req.body)
      return this.created(res, { sequence: seq }, 'Sequence created')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async update(req, res) {
    try {
      const seq = await service.update(req.params.id, req.body)
      return this.ok(res, { sequence: seq }, 'Sequence updated')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async reset(req, res) {
    try {
      const seq = await service.resetSequence(req.params.id)
      return this.ok(res, { sequence: seq }, 'Sequence reset to initial value')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return this.ok(res, null, 'Sequence deleted')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }
}

module.exports = new SequenceController()
