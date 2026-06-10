const { ok, created, fail, serverError } = require('../../core/response')
const { orgIdOf } = require('../../core/tenant')
const service = require('./team.service')

module.exports = {
  async list(req, res) {
    try {
      const staff = await service.list(orgIdOf(req), { search: req.query.search || '' })
      return ok(res, { staff })
    } catch (err) {
      return serverError(res)
    }
  },

  async assignableRoles(req, res) {
    try {
      return ok(res, { roles: await service.assignableRoles(req.user) })
    } catch (err) {
      return serverError(res)
    }
  },

  async getById(req, res) {
    try {
      const staff = await service.getById(orgIdOf(req), req.params.id)
      return ok(res, { staff })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      const staff = await service.create(orgIdOf(req), req.body, req.user)
      return created(res, { staff }, 'Staff member created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async update(req, res) {
    try {
      const staff = await service.update(orgIdOf(req), req.params.id, req.body, req.user)
      return ok(res, { staff }, 'Staff member updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async setPassword(req, res) {
    try {
      await service.setPassword(orgIdOf(req), req.params.id, req.body.newPassword)
      return ok(res, null, 'Password updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async assignRoles(req, res) {
    try {
      const staff = await service.assignRoles(orgIdOf(req), req.params.id, req.body.roleIds || [], req.user)
      return ok(res, { staff }, 'Roles assigned')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      await service.remove(orgIdOf(req), req.params.id, req.user)
      return ok(res, null, 'Staff member deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
