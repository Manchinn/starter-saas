const { CustomerGroup } = require('../../../server/models')
const { Op } = require('sequelize')

const list = async ({ page = 1, limit = 20, search = '' }) => {
  const offset = (page - 1) * limit
  const where = search
    ? { name: { [Op.like]: `%${search}%` } }
    : {}

  const { count, rows } = await CustomerGroup.findAndCountAll({
    where,
    limit,
    offset,
    order: [['name', 'ASC']],
  })

  return { total: count, page, limit, groups: rows }
}

const listAll = async () => {
  return CustomerGroup.findAll({ where: { status: 'active' }, order: [['name', 'ASC']] })
}

const getById = async (id) => {
  const group = await CustomerGroup.findByPk(id)
  if (!group) throw { status: 404, message: 'Customer group not found' }
  return group
}

const create = async ({ name, description, status = 'active' }) => {
  if (!name?.trim()) throw { status: 400, message: 'Name is required' }
  return CustomerGroup.create({ name: name.trim(), description, status })
}

const update = async (id, data) => {
  const group = await CustomerGroup.findByPk(id)
  if (!group) throw { status: 404, message: 'Customer group not found' }
  const allowed = ['name', 'description', 'status']
  const patch = Object.fromEntries(
    Object.entries(data).filter(([k, v]) => allowed.includes(k) && v !== undefined)
  )
  await group.update(patch)
  return group.reload()
}

const remove = async (id) => {
  const group = await CustomerGroup.findByPk(id)
  if (!group) throw { status: 404, message: 'Customer group not found' }
  await group.destroy()
}

module.exports = { list, listAll, getById, create, update, remove }
