const { UOM } = require('../../../server/models')
const { Op } = require('sequelize')

const list = async ({ page = 1, limit = 20, search = '', status = '', activeFrom = '', activeTo = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (search) where[Op.or] = [{ name: { [Op.like]: `%${search}%` } }, { abbreviation: { [Op.like]: `%${search}%` } }]
  if (status) where.status = status
  if (activeFrom) where.activeFrom = { [Op.gte]: activeFrom }
  if (activeTo) where.activeTo = { [Op.lte]: activeTo }
  const { count, rows } = await UOM.findAndCountAll({ where, limit, offset, order: [['name', 'ASC']] })
  return { total: count, page, limit, uoms: rows }
}

const getById = async (id) => {
  const uom = await UOM.findByPk(id)
  if (!uom) throw { status: 404, message: 'UOM not found' }
  return uom
}

const create = async ({ name, abbreviation, description, status = 'active', activeFrom, activeTo, userId, organizationId }) => {
  if (!name?.trim()) throw { status: 400, message: 'Name is required' }
  if (!abbreviation?.trim()) throw { status: 400, message: 'Abbreviation is required' }
  const existing = await UOM.findOne({ where: { abbreviation: abbreviation.trim(), organizationId: organizationId || null } })
  if (existing) throw { status: 400, message: 'UOM abbreviation already exists' }
  return UOM.create({ name: name.trim(), abbreviation: abbreviation.trim(), description, status, activeFrom: activeFrom || null, activeTo: activeTo || null, organizationId: organizationId || null, createdBy: userId || null })
}

const update = async (id, data, userId) => {
  const uom = await UOM.findByPk(id)
  if (!uom) throw { status: 404, message: 'UOM not found' }
  if (data.abbreviation?.trim()) {
    const existing = await UOM.findOne({ where: { abbreviation: data.abbreviation.trim(), createdBy: uom.createdBy } })
    if (existing && existing.id !== id) throw { status: 400, message: 'UOM abbreviation already exists' }
  }
  const allowed = ['name', 'abbreviation', 'description', 'status', 'activeFrom', 'activeTo']
  const patch = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)))
  if ('activeFrom' in patch) patch.activeFrom = patch.activeFrom || null
  if ('activeTo'   in patch) patch.activeTo   = patch.activeTo   || null
  patch.modifiedBy = userId || null
  await uom.update(patch)
  return uom.reload()
}

const remove = async (id) => {
  const uom = await UOM.findByPk(id)
  if (!uom) throw { status: 404, message: 'UOM not found' }
  await uom.destroy()
}

module.exports = { list, getById, create, update, remove }
