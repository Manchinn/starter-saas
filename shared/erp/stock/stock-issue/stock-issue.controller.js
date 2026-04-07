const BaseController = require('../../../../server/core/BaseController')
const service = require('./stock-issue.service')

class StockIssueController extends BaseController {
  async list(req, res) {
    try {
      const { page, limit, search } = req.query
      const result = await service.list({ page: +page || 1, limit: +limit || 20, search: search || '' })
      return this.ok(res, result)
    } catch (err) {
      return this.serverError(res)
    }
  }

  async getById(req, res) {
    try {
      const issue = await service.getById(req.params.id)
      return this.ok(res, { issue })
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async create(req, res) {
    try {
      const issue = await service.create({ ...req.body, userId: req.user?.id })
      return this.created(res, { issue }, 'Stock Issue created')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async confirm(req, res) {
    try {
      const issue = await service.confirm(req.params.id)
      return this.ok(res, { issue }, 'Stock Issue confirmed')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return this.ok(res, null, 'Stock Issue deleted')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }
}

module.exports = new StockIssueController()
