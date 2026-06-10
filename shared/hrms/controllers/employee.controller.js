const { ok, created, fail, serverError } = require('../../../server/core/response')
const service = require('../services/employee.service')

// The org an employee operation runs against. A system admin may target any
// organization by passing its id (so the admin can manage staff org-by-org,
// e.g. drilled in from the Organizations list); everyone else is pinned to
// their own org. Non-admins' org hints are ignored.
const orgScope = (req, hint) =>
  (req.user.role === 'admin' && hint) ? hint : (req.user.organizationId || req.user.id)

module.exports = {
  async list(req, res) {
    try {
      const { page, limit, search, status, activeFrom, activeTo } = req.query
      const organizationId = orgScope(req, req.query.organizationId)
      const result = await service.list({ organizationId, page: +page || 1, limit: +limit || 20, search: search || '', status: status || '', activeFrom: activeFrom || '', activeTo: activeTo || '' })
      return ok(res, result)
    } catch (err) {
      return serverError(res)
    }
  },

  async getById(req, res) {
    try {
      const organizationId = orgScope(req, req.query.organizationId)
      const emp = await service.getById(req.params.id, organizationId)
      return ok(res, { employee: emp })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      const organizationId = orgScope(req, req.body.organizationId)
      const emp = await service.create({ ...req.body, createdByUserId: req.user?.id, organizationId })
      return created(res, { employee: emp }, 'Employee created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async update(req, res) {
    try {
      const organizationId = orgScope(req, req.body.organizationId)
      const emp = await service.update(req.params.id, req.body, organizationId, req.user?.id)
      return ok(res, { employee: emp }, 'Employee updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      const organizationId = orgScope(req, req.query.organizationId)
      await service.remove(req.params.id, organizationId)
      return ok(res, null, 'Employee deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
