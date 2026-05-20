const { ok, created, fail, serverError } = require('../../core/response')
const organizationService = require('./organization.service')

module.exports = {
  async create(req, res) {
    try {
      const organization = await organizationService.create(req.body)
      return created(res, { organization }, 'Organization created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async list(req, res) {
    try {
      const { page, limit, search } = req.query
      const result = await organizationService.list({ page: +page || 1, limit: +limit || 20, search: search || '' })
      return ok(res, result)
    } catch (err) {
      return serverError(res)
    }
  },

  async getById(req, res) {
    try {
      const organization = await organizationService.getById(req.params.id)
      return ok(res, { organization })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async update(req, res) {
    try {
      const organization = await organizationService.update(req.params.id, req.body)
      return ok(res, { organization }, 'Organization updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      await organizationService.remove(req.params.id)
      return ok(res, null, 'Organization deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async uploadLogo(req, res) {
    try {
      const organization = await organizationService.uploadLogo(req.params.id, {
        dataBase64:  req.body?.dataBase64,
        contentType: req.body?.contentType,
      })
      return ok(res, { organization }, 'Logo updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async removeLogo(req, res) {
    try {
      const organization = await organizationService.removeLogo(req.params.id)
      return ok(res, { organization }, 'Logo removed')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async assignModules(req, res) {
    try {
      const organization = await organizationService.assignModules(req.params.id, req.body.moduleIds || [])
      return ok(res, { organization }, 'Modules assigned')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async assignRoles(req, res) {
    try {
      const organization = await organizationService.assignRoles(req.params.id, req.body.roleIds || [])
      return ok(res, { organization }, 'Roles assigned')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async myModules(req, res) {
    try {
      const modules = await organizationService.getMyModules(req.user.id)
      return ok(res, { modules })
    } catch (err) {
      return serverError(res)
    }
  },

  async myPermissions(req, res) {
    try {
      const result = await organizationService.getUserPermissions(req.user.id)
      return ok(res, result)
    } catch (err) {
      return serverError(res)
    }
  },

  async listStaff(req, res) {
    try {
      const organizationId = req.user.organizationId || req.user.id
      const { search } = req.query
      const staff = await organizationService.getStaff(organizationId, search)
      return ok(res, { staff })
    } catch (err) {
      return serverError(res)
    }
  },

  async listAllStaff(req, res) {
    try {
      const { page, limit, search, organizationId } = req.query
      const result = await organizationService.listAllStaff({
        page: +page || 1,
        limit: +limit || 20,
        search: search || '',
        organizationId: organizationId || null,
      })
      return ok(res, result)
    } catch (err) {
      return serverError(res)
    }
  },

  async listAll(req, res) {
    try {
      const organizations = await organizationService.listAll()
      return ok(res, { organizations })
    } catch (err) {
      return serverError(res)
    }
  },
}
