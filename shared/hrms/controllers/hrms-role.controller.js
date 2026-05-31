const { ok, created, fail, serverError } = require('../../../server/core/response')
const service = require('../services/hrms-role.service')

const orgId = (req) => req.user.organizationId || req.user.id

module.exports = {
  async list(req, res) {
    try {
      return ok(res, { roles: await service.list(orgId(req)) })
    } catch (err) {
      return serverError(res)
    }
  },

  async getById(req, res) {
    try {
      return ok(res, { role: await service.getById(req.params.id, orgId(req)) })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      const role = await service.create(orgId(req), req.body, req.user?.id)
      return created(res, { role }, 'Role created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async update(req, res) {
    try {
      const role = await service.update(req.params.id, orgId(req), req.body, req.user?.id)
      return ok(res, { role }, 'Role updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      await service.remove(req.params.id, orgId(req))
      return ok(res, null, 'Role deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async assignPermissions(req, res) {
    try {
      const role = await service.assignPermissions(req.params.id, orgId(req), req.body.permissionIds || [])
      return ok(res, { role }, 'Permissions assigned')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
