const { Store, StoreStock } = require('../../../../server/models')
const { Op } = require('sequelize')
const { findByPkScoped } = require('../../../../server/core/tenant')

const list = async ({ page = 1, limit = 20, search = '', status = '', activeFrom = '', activeTo = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (search) where[Op.or] = [{ name: { [Op.like]: `%${search}%` } }, { code: { [Op.like]: `%${search}%` } }]
  if (status) where.status = status
  if (activeFrom) where.activeFrom = { [Op.gte]: activeFrom }
  if (activeTo) where.activeTo = { [Op.lte]: activeTo }
  const { count, rows } = await Store.findAndCountAll({ where, limit, offset, order: [['name', 'ASC']] })
  return { total: count, page, limit, stores: rows }
}

const getById = async (id, organizationId) => {
  const store = await findByPkScoped(Store, id, organizationId)
  if (!store) throw { status: 404, message: 'Store not found' }
  return store
}

const create = async ({ name, code, address, phone, email, status = 'active', activeFrom, activeTo, autoCode, userId, organizationId }) => {
  if (!name?.trim()) throw { status: 400, message: 'Name is required' }
  if (autoCode) {
    const seqSvc = require('../../settings/services/sequence.service')
    code = await seqSvc.getNext('WHS', userId)
  } else if (code?.trim()) {
    const existing = await Store.findOne({ where: { code: code.trim(), organizationId: organizationId || null } })
    if (existing) throw { status: 400, message: 'Store code already exists' }
  }
  return Store.create({ name: name.trim(), code: code?.trim() || null, address, phone, email, status, activeFrom: activeFrom || null, activeTo: activeTo || null, organizationId: organizationId || null, createdBy: userId || null })
}

const update = async (id, data, userId, organizationId) => {
  const store = await findByPkScoped(Store, id, organizationId)
  if (!store) throw { status: 404, message: 'Store not found' }
  if (data.code?.trim()) {
    const existing = await Store.findOne({ where: { code: data.code.trim(), createdBy: store.createdBy } })
    if (existing && existing.id !== id) throw { status: 400, message: 'Store code already exists' }
  }
  const allowed = ['name', 'code', 'address', 'phone', 'email', 'status', 'activeFrom', 'activeTo']
  const patch = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)))
  if ('activeFrom' in patch) patch.activeFrom = patch.activeFrom || null
  if ('activeTo'   in patch) patch.activeTo   = patch.activeTo   || null
  patch.modifiedBy = userId || null
  await store.update(patch)
  return store.reload()
}

const remove = async (id, organizationId) => {
  const store = await findByPkScoped(Store, id, organizationId)
  if (!store) throw { status: 404, message: 'Store not found' }
  const stockOnHand = await StoreStock.sum('stock', { where: { storeId: id } })
  if (stockOnHand > 0) throw { status: 400, message: `Cannot delete "${store.name}" — it has ${stockOnHand} unit(s) of stock on hand. Transfer or adjust stock to zero first.` }
  await store.destroy()
}

module.exports = { list, getById, create, update, remove }
