const { Vendor } = require('../../server/models')
const { Op } = require('sequelize')

const list = async ({ page = 1, limit = 20, search = '', status = '' }) => {
  const offset = (page - 1) * limit
  const where = {}
  if (search) where[Op.or] = [
    { name:  { [Op.like]: `%${search}%` } },
    { code:  { [Op.like]: `%${search}%` } },
    { email: { [Op.like]: `%${search}%` } },
  ]
  if (status) where.status = status

  const { count, rows } = await Vendor.findAndCountAll({
    where, limit, offset,
    order: [['createdAt', 'DESC']],
  })
  return { total: count, page, limit, vendors: rows }
}

const getById = async (id) => {
  const vendor = await Vendor.findByPk(id)
  if (!vendor) throw { status: 404, message: 'Vendor not found' }
  return vendor
}

const create = async ({ name, code, contactPerson, email, phone, address, notes, status = 'active' }) => {
  if (!name?.trim()) throw { status: 400, message: 'Name is required' }
  return Vendor.create({ name: name.trim(), code: code?.trim() || null, contactPerson, email, phone, address, notes, status })
}

const update = async (id, { name, code, contactPerson, email, phone, address, notes, status }) => {
  const vendor = await Vendor.findByPk(id)
  if (!vendor) throw { status: 404, message: 'Vendor not found' }
  await vendor.update({
    ...(name          !== undefined && { name: name.trim() }),
    ...(code          !== undefined && { code: code?.trim() || null }),
    ...(contactPerson !== undefined && { contactPerson }),
    ...(email         !== undefined && { email }),
    ...(phone         !== undefined && { phone }),
    ...(address       !== undefined && { address }),
    ...(notes         !== undefined && { notes }),
    ...(status        !== undefined && { status }),
  })
  return vendor
}

const remove = async (id) => {
  const vendor = await Vendor.findByPk(id)
  if (!vendor) throw { status: 404, message: 'Vendor not found' }
  await vendor.destroy()
}

const listAll = async () => {
  return Vendor.findAll({ where: { status: 'active' }, order: [['name', 'ASC']] })
}

module.exports = { list, getById, create, update, remove, listAll }
