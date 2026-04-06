const { UOM } = require('../../server/models')
const { Op } = require('sequelize')

const list = async ({ page = 1, limit = 20, search = '' }) => {
  const offset = (page - 1) * limit
  const where = search
    ? { [Op.or]: [{ name: { [Op.like]: `%${search}%` } }, { abbreviation: { [Op.like]: `%${search}%` } }] }
    : {}
  const { count, rows } = await UOM.findAndCountAll({ where, limit, offset, order: [['name', 'ASC']] })
  return { total: count, page, limit, uoms: rows }
}

const getById = async (id) => {
  const uom = await UOM.findByPk(id)
  if (!uom) throw { status: 404, message: 'UOM not found' }
  return uom
}

const create = async ({ name, abbreviation, description, status = 'active' }) => {
  if (!name?.trim()) throw { status: 400, message: 'Name is required' }
  if (!abbreviation?.trim()) throw { status: 400, message: 'Abbreviation is required' }
  return UOM.create({ name: name.trim(), abbreviation: abbreviation.trim(), description, status })
}

const update = async (id, data) => {
  const uom = await UOM.findByPk(id)
  if (!uom) throw { status: 404, message: 'UOM not found' }
  const allowed = ['name', 'abbreviation', 'description', 'status']
  const patch = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)))
  await uom.update(patch)
  return uom.reload()
}

const remove = async (id) => {
  const uom = await UOM.findByPk(id)
  if (!uom) throw { status: 404, message: 'UOM not found' }
  await uom.destroy()
}

module.exports = { list, getById, create, update, remove }
