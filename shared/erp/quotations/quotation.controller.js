const { ok, created, fail, serverError } = require('../../../server/core/response')
const service = require('./quotation.service')

module.exports = {
  async list(req, res) {
    try {
      const { page, limit, search, status, dateFrom, dateTo } = req.query
      const orgId = req.user?.organizationId || req.user?.id
      const result = await service.list({
        page: +page || 1, limit: +limit || 20,
        search: search || '', status: status || '',
        dateFrom: dateFrom || '', dateTo: dateTo || '',
        organizationId: orgId,
      })
      return ok(res, result)
    } catch (err) { return serverError(res) }
  },

  async getById(req, res) {
    try {
      const q = await service.getById(req.params.id)
      return ok(res, { quotation: q })
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },

  async create(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const q = await service.create({ ...req.body, userId: req.user?.id, organizationId: orgId })
      return created(res, { quotation: q }, 'Quotation created')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },

  async update(req, res) {
    try {
      const q = await service.update(req.params.id, req.body, req.user?.id)
      return ok(res, { quotation: q }, 'Quotation updated')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },

  async updateStatus(req, res) {
    try {
      const q = await service.updateStatus(req.params.id, req.body.status, req.user?.id)
      return ok(res, { quotation: q }, 'Status updated')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },

  async convertToOrder(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const result = await service.convertToOrder(req.params.id, req.user?.id, orgId)
      return ok(res, result, 'Converted to sales order')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return ok(res, null, 'Quotation deleted')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
}
