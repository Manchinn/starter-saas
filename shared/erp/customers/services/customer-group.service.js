const { CustomerGroup } = require('../../../../server/models')
const { Op } = require('sequelize')

const list = async ({ page = 1, limit = 20, search = '', status = '', activeFrom = '', activeTo = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (search) where.name = { [Op.like]: `%${search}%` }
  if (status) where.status = status
  if (activeFrom) where.activeFrom = { [Op.gte]: activeFrom }
  if (activeTo) where.activeTo = { [Op.lte]: activeTo }

  const { count, rows } = await CustomerGroup.findAndCountAll({
    where,
    limit,
    offset,
    order: [['name', 'ASC']],
  })

  return { total: count, page, limit, groups: rows }
}

const listAll = async (organizationId) => {
  return CustomerGroup.findAll({ where: { status: 'active', organizationId: organizationId || null }, order: [['name', 'ASC']] })
}

const getById = async (id) => {
  const group = await CustomerGroup.findByPk(id)
  if (!group) throw { status: 404, message: 'Customer group not found' }
  return group
}

const create = async ({ name, code, autoCode, description, status = 'active', activeFrom, activeTo, userId, organizationId }) => {
  if (!name?.trim()) throw { status: 400, message: 'Name is required' }
  if (autoCode) {
    const seqSvc = require('../../settings/services/sequence.service')
    code = await seqSvc.getNext('CGP', userId)
  } else if (code?.trim()) {
    const existing = await CustomerGroup.findOne({ where: { code: code.trim(), organizationId: organizationId || null } })
    if (existing) throw { status: 400, message: 'Customer group code already exists' }
  }
  return CustomerGroup.create({ name: name.trim(), code: code?.trim() || null, description, status, activeFrom: activeFrom || null, activeTo: activeTo || null, organizationId: organizationId || null, createdBy: userId || null, modifiedBy: userId || null })
}

const update = async (id, data, userId) => {
  const group = await CustomerGroup.findByPk(id)
  if (!group) throw { status: 404, message: 'Customer group not found' }
  const allowed = ['name', 'code', 'description', 'status', 'activeFrom', 'activeTo']
  const patch = Object.fromEntries(
    Object.entries(data).filter(([k, v]) => allowed.includes(k) && v !== undefined)
  )
  if ('activeFrom' in patch) patch.activeFrom = patch.activeFrom || null
  if ('activeTo'   in patch) patch.activeTo   = patch.activeTo   || null
  patch.modifiedBy = userId || null
  await group.update(patch)
  return group.reload()
}

const remove = async (id) => {
  const group = await CustomerGroup.findByPk(id)
  if (!group) throw { status: 404, message: 'Customer group not found' }
  await group.destroy()
}

module.exports = { list, listAll, getById, create, update, remove }
