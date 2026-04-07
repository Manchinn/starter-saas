const { Store, StoreStock } = require('../../../server/models')
const { Op } = require('sequelize')

const list = async ({ page = 1, limit = 20, search = '' }) => {
  const offset = (page - 1) * limit
  const where = search
    ? { [Op.or]: [{ name: { [Op.like]: `%${search}%` } }, { code: { [Op.like]: `%${search}%` } }] }
    : {}
  const { count, rows } = await Store.findAndCountAll({ where, limit, offset, order: [['name', 'ASC']] })
  return { total: count, page, limit, stores: rows }
}

const getById = async (id) => {
  const store = await Store.findByPk(id)
  if (!store) throw { status: 404, message: 'Store not found' }
  return store
}

const create = async ({ name, code, address, phone, email, status = 'active', autoCode, userId }) => {
  if (!name?.trim()) throw { status: 400, message: 'Name is required' }
  if (autoCode) {
    const seqSvc = require('../settings/sequence.service')
    code = await seqSvc.getNext('WHS', userId)
  } else if (code?.trim()) {
    const existing = await Store.findOne({ where: { code: code.trim(), createdBy: userId || null } })
    if (existing) throw { status: 400, message: 'Store code already exists' }
  }
  return Store.create({ name: name.trim(), code: code?.trim() || null, address, phone, email, status, createdBy: userId || null })
}

const update = async (id, data, userId) => {
  const store = await Store.findByPk(id)
  if (!store) throw { status: 404, message: 'Store not found' }
  if (data.code?.trim()) {
    const existing = await Store.findOne({ where: { code: data.code.trim(), createdBy: store.createdBy } })
    if (existing && existing.id !== id) throw { status: 400, message: 'Store code already exists' }
  }
  const allowed = ['name', 'code', 'address', 'phone', 'email', 'status']
  const patch = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)))
  await store.update(patch)
  return store.reload()
}

const remove = async (id) => {
  const store = await Store.findByPk(id)
  if (!store) throw { status: 404, message: 'Store not found' }
  const stockOnHand = await StoreStock.sum('stock', { where: { storeId: id } })
  if (stockOnHand > 0) throw { status: 400, message: `Cannot delete "${store.name}" — it has ${stockOnHand} unit(s) of stock on hand. Transfer or adjust stock to zero first.` }
  await store.destroy()
}

module.exports = { list, getById, create, update, remove }
