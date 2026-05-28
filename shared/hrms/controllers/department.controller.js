const { ok, created, fail, notFound, serverError } = require('../../../server/core/response')
const departmentService = require('../services/department.service')
const { getNext } = require('../../erp/settings/services/sequence.service')

module.exports = {
  async list(req, res) {
    try {
      const { page, limit, search, isActive, activeFrom, activeTo, organizationId: queryOrgId } = req.query
      const defaultOrgId = req.user.organizationId || req.user.id
      // Admin can query departments for a specific organization
      const orgId = (req.user.role === 'admin' && queryOrgId) ? queryOrgId : defaultOrgId
      const result = await departmentService.list({
        organizationId: orgId,
        page: +page || 1,
        limit: +limit || 20,
        search: search || '',
        isActive: isActive,
        activeFrom: activeFrom || '',
        activeTo: activeTo || '',
      })
      return ok(res, result)
    } catch (err) {
      return serverError(res)
    }
  },

  async create(req, res) {
    try {
      const orgId = req.user.organizationId || req.user.id
      const { autoCode, ...body } = req.body
      if (autoCode) body.code = await getNext('DEP', orgId)
      const department = await departmentService.create({ ...body, organizationId: orgId, createdBy: req.user.id })
      return created(res, department)
    } catch (err) {
      if (err.status) return fail(res, err.message, err.status)
      return serverError(res)
    }
  },

  async getById(req, res) {
    try {
      const orgId = req.user.organizationId || req.user.id
      const department = await departmentService.getById(req.params.id, orgId)
      if (!department) return notFound(res, 'Department not found')
      return ok(res, department)
    } catch (err) {
      return serverError(res)
    }
  },

  async update(req, res) {
    try {
      const orgId = req.user.organizationId || req.user.id
      const department = await departmentService.update(req.params.id, orgId, req.body, req.user?.id)
      return ok(res, department)
    } catch (err) {
      if (err.message === 'Department not found') return notFound(res, err.message)
      return serverError(res)
    }
  },

  async remove(req, res) {
    try {
      const orgId = req.user.organizationId || req.user.id
      await departmentService.remove(req.params.id, orgId)
      return ok(res, null, 'Department deleted', 204)
    } catch (err) {
      if (err.message === 'Department not found') return notFound(res, err.message)
      return serverError(res)
    }
  },
}
