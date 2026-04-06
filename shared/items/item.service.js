const { Item } = require('../../server/models')
const { Op } = require('sequelize')

const list = async ({ page = 1, limit = 20, search = '', status = '' }) => {
  const offset = (page - 1) * limit
  const where = {}
  if (search) where.title = { [Op.like]: `%${search}%` }
  if (status) where.status = status

  const { count, rows } = await Item.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  })

  return { total: count, page, limit, items: rows }
}

const getById = async (id) => {
  const item = await Item.findByPk(id)
  if (!item) throw { status: 404, message: 'Item not found' }
  return item
}

const create = async ({ title, description, status = 'active' }) => {
  if (!title?.trim()) throw { status: 400, message: 'Title is required' }
  return Item.create({ title: title.trim(), description, status })
}

const update = async (id, { title, description, status }) => {
  const item = await Item.findByPk(id)
  if (!item) throw { status: 404, message: 'Item not found' }
  const allowed = { title, description, status }
  await item.update(Object.fromEntries(Object.entries(allowed).filter(([, v]) => v !== undefined)))
  return item.reload()
}

const remove = async (id) => {
  const item = await Item.findByPk(id)
  if (!item) throw { status: 404, message: 'Item not found' }
  await item.destroy()
}

module.exports = { list, getById, create, update, remove }
