const { ok, created, fail, serverError } = require('../../../../server/core/response')
const { orgIdOf } = require('../../../../server/core/tenant')
const service = require('../services/alert.service')

module.exports = {
  // Bell feed for the current user.
  async feed(req, res) {
    try {
      const result = await service.listForUser(req.user, { limit: +req.query.limit || 50 })
      return ok(res, result)
    } catch (err) {
      return serverError(res)
    }
  },

  async unreadCount(req, res) {
    try {
      const unread = await service.unreadCount(req.user)
      return ok(res, { unread })
    } catch (err) {
      return serverError(res)
    }
  },

  async markRead(req, res) {
    try {
      await service.markRead(req.params.id, req.user.id)
      return ok(res, null, 'Marked read')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async markAllRead(req, res) {
    try {
      const count = await service.markAllRead(req.user)
      return ok(res, { count }, 'All marked read')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  // Management list (authors).
  async list(req, res) {
    try {
      const { page, limit, scope, search } = req.query
      const result = await service.listAll({
        page: +page || 1, limit: +limit || 20,
        scope: scope || '', search: search || '',
        organizationId: orgIdOf(req),
      })
      return ok(res, result)
    } catch (err) {
      return serverError(res)
    }
  },

  async options(req, res) {
    try {
      const result = await service.options(orgIdOf(req))
      return ok(res, result)
    } catch (err) {
      return serverError(res)
    }
  },

  async getById(req, res) {
    try {
      const alert = await service.getById(req.params.id, orgIdOf(req))
      return ok(res, { alert })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      const alert = await service.create({ ...req.body, userId: req.user?.id, organizationId: orgIdOf(req) })
      return created(res, { alert }, 'Alert created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async update(req, res) {
    try {
      const alert = await service.update(req.params.id, req.body, req.user?.id, orgIdOf(req))
      return ok(res, { alert }, 'Alert updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      await service.remove(req.params.id, orgIdOf(req))
      return ok(res, null, 'Alert deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
