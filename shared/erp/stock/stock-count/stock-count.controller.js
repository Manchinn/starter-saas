const { ok, created, fail, serverError } = require('../../../../server/core/response')
const service = require('./stock-count.service')

module.exports = {
  async list(req, res) {
    try {
      const { page, limit, search } = req.query
      const orgId = req.user?.organizationId || req.user?.id
      const result = await service.list({ page: +page || 1, limit: +limit || 20, search: search || '', organizationId: orgId })
      return ok(res, result)
    } catch (err) {
      return serverError(res)
    }
  },

  async getById(req, res) {
    try {
      const sc = await service.getById(req.params.id)
      return ok(res, { stockCount: sc })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async getStoreProducts(req, res) {
    try {
      const { storeId } = req.query
      if (!storeId) return fail(res, 'storeId is required', 400)
      const products = await service.getStoreProducts(storeId)
      return ok(res, { products })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async create(req, res) {
    try {
      const orgId = req.user?.organizationId || req.user?.id
      const sc = await service.create({ ...req.body, userId: req.user?.id, organizationId: orgId })
      return created(res, { stockCount: sc }, 'Stock Count created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async update(req, res) {
    try {
      const sc = await service.update(req.params.id, { ...req.body, userId: req.user?.id })
      return ok(res, { stockCount: sc }, 'Stock Count updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async confirm(req, res) {
    try {
      const sc = await service.confirm(req.params.id, req.user?.id)
      return ok(res, { stockCount: sc }, 'Stock Count confirmed')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async lock(req, res) {
    try {
      const sc = await service.setLock(req.params.id, true, req.user?.id)
      return ok(res, { stockCount: sc }, 'Stock Count locked')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async unlock(req, res) {
    try {
      const sc = await service.setLock(req.params.id, false, req.user?.id)
      return ok(res, { stockCount: sc }, 'Stock Count unlocked')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async remove(req, res) {
    try {
      await service.remove(req.params.id)
      return ok(res, null, 'Stock Count deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async checkLock(req, res) {
    try {
      const { storeId } = req.params
      const { StockCount } = require('../../../../server/models')
      const locked = await StockCount.findOne({
        where: { storeId, status: 'draft', movementLocked: true },
        attributes: ['id', 'refNo'],
      })
      return ok(res, { isLocked: !!locked, lockedBy: locked })
    } catch (err) {
      return serverError(res)
    }
  },
}
