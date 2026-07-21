const { ok, created, fail, serverError } = require('../../../server/core/response')
const service = require('../services/employee.service')

/**
 * Platform admins may target another organization via query or body.
 * Non-admins are always locked to their own organization.
 */
function resolveOrganizationId(req, { prefer = 'query' } = {}) {
  const defaultOrgId = req.user.organizationId || req.user.id
  if (req.user.role !== 'admin') return defaultOrgId

  const fromQuery = req.query?.organizationId
  const fromBody = req.body?.organizationId
  if (prefer === 'body') return fromBody || fromQuery || defaultOrgId
  return fromQuery || fromBody || defaultOrgId
}

module.exports = {
  async roleOptions(req, res) {
    try {
      return ok(res, { roles: await service.listAssignableRoles(req.user) })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async list(req, res) {
    try {
      const { page, limit, search, status, activeFrom, activeTo, departmentId } = req.query
      const organizationId = resolveOrganizationId(req, { prefer: 'query' })
      const result = await service.list({
        organizationId,
        page: +page || 1,
        limit: +limit || 20,
        search: search || '',
        status: status || '',
        departmentId: departmentId || '',
        activeFrom: activeFrom || '',
        activeTo: activeTo || '',
      })
      return ok(res, result)
    } catch (err) {
      if (err.status) return fail(res, err.message, err.status)
      return serverError(res)
    }
  },

  async getById(req, res) {
    try {
      const organizationId = resolveOrganizationId(req, { prefer: 'query' })
      const emp = await service.getById(req.params.id, organizationId)
      return ok(res, { employee: emp })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      const organizationId = resolveOrganizationId(req, { prefer: 'body' })
      const emp = await service.create({ ...req.body, createdByUserId: req.user?.id, organizationId, actor: req.user })
      return created(res, { employee: emp }, 'Employee created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async update(req, res) {
    try {
      const organizationId = resolveOrganizationId(req, { prefer: 'body' })
      const emp = await service.update(req.params.id, req.body, organizationId, req.user?.id, req.user)
      return ok(res, { employee: emp }, 'Employee updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async offboard(req, res) {
    try {
      const organizationId = resolveOrganizationId(req, { prefer: 'body' })
      const result = await service.offboard(
        req.params.id,
        organizationId,
        req.user.id,
        req.user,
        req.body.activeTo,
      )
      return ok(res, result, 'Employee offboarded')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async accessHistory(req, res) {
    try {
      const organizationId = resolveOrganizationId(req, { prefer: 'query' })
      const result = await service.listAccessHistory(req.params.id, organizationId, {
        page: +req.query.page || 1,
        limit: +req.query.limit || 20,
      })
      return ok(res, result)
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      const organizationId = resolveOrganizationId(req, { prefer: 'query' })
      await service.remove(req.params.id, organizationId)
      return ok(res, null, 'Employee deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
