const { Vendor } = require('../../../server/models')
const { Op } = require('sequelize')

const list = async ({ page = 1, limit = 20, search = '', status = '', typeFilter = '', activeFrom = '', activeTo = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (search) where[Op.or] = [
    { name:  { [Op.like]: `%${search}%` } },
    { code:  { [Op.like]: `%${search}%` } },
    { email: { [Op.like]: `%${search}%` } },
  ]
  if (status) where.status = status
  if (typeFilter) where.vendorTypes = { [Op.like]: `%${typeFilter}%` }
  if (activeFrom) where.activeFrom = { [Op.gte]: activeFrom }
  if (activeTo) where.activeTo = { [Op.lte]: activeTo }

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

const create = async ({ name, code, contactPerson, email, phone, address, notes, vendorTypes, status = 'active', activeFrom, activeTo, autoCode, userId, organizationId }) => {
  if (!name?.trim()) throw { status: 400, message: 'Name is required' }
  if (autoCode) {
    const seqSvc = require('../settings/sequence.service')
    code = await seqSvc.getNext('VND', userId)
  } else if (code?.trim()) {
    const existing = await Vendor.findOne({ where: { code: code.trim(), organizationId: organizationId || null } })
    if (existing) throw { status: 400, message: 'Vendor code already exists' }
  }
  return Vendor.create({ name: name.trim(), code: code?.trim() || null, contactPerson, email, phone, address, notes, vendorTypes: vendorTypes || [], status, activeFrom: activeFrom || null, activeTo: activeTo || null, organizationId: organizationId || null, createdBy: userId || null })
}

const update = async (id, { name, code, contactPerson, email, phone, address, notes, vendorTypes, status, activeFrom, activeTo }, userId) => {
  const vendor = await Vendor.findByPk(id)
  if (!vendor) throw { status: 404, message: 'Vendor not found' }
  if (code?.trim()) {
    const existing = await Vendor.findOne({ where: { code: code.trim(), createdBy: vendor.createdBy } })
    if (existing && existing.id !== id) throw { status: 400, message: 'Vendor code already exists' }
  }
  await vendor.update({
    ...(name          !== undefined && { name: name.trim() }),
    ...(code          !== undefined && { code: code?.trim() || null }),
    ...(contactPerson !== undefined && { contactPerson }),
    ...(email         !== undefined && { email }),
    ...(phone         !== undefined && { phone }),
    ...(address       !== undefined && { address }),
    ...(notes         !== undefined && { notes }),
    ...(vendorTypes   !== undefined && { vendorTypes }),
    ...(status        !== undefined && { status }),
    ...(activeFrom    !== undefined && { activeFrom: activeFrom || null }),
    ...(activeTo      !== undefined && { activeTo: activeTo || null }),
    modifiedBy: userId || null,
  })
  return vendor
}

const remove = async (id) => {
  const vendor = await Vendor.findByPk(id)
  if (!vendor) throw { status: 404, message: 'Vendor not found' }
  await vendor.destroy()
}

const listAll = async (organizationId) => {
  return Vendor.findAll({ where: { status: 'active', organizationId: organizationId || null }, order: [['name', 'ASC']] })
}

module.exports = { list, getById, create, update, remove, listAll }
