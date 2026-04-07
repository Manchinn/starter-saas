const { ProductCategory } = require('../../../server/models')
const { Op } = require('sequelize')

const parentInclude = { model: ProductCategory, as: 'parent', attributes: ['id', 'name'] }

const list = async ({ page = 1, limit = 20, search = '' }) => {
  const offset = (page - 1) * limit
  const where = search ? { name: { [Op.like]: `%${search}%` } } : {}
  const { count, rows } = await ProductCategory.findAndCountAll({
    where,
    limit,
    offset,
    order: [['name', 'ASC']],
    include: [parentInclude],
    distinct: true,
  })
  return { total: count, page, limit, categories: rows }
}

const listAll = async () => {
  return ProductCategory.findAll({
    where: { status: 'active' },
    attributes: ['id', 'name', 'parentId'],
    order: [['name', 'ASC']],
  })
}

const getById = async (id) => {
  const cat = await ProductCategory.findByPk(id, {
    include: [
      parentInclude,
      { model: ProductCategory, as: 'children', attributes: ['id', 'name', 'status'] },
    ],
  })
  if (!cat) throw { status: 404, message: 'Product category not found' }
  return cat
}

const create = async ({ code, name, description, parentId, status = 'active', userId }) => {
  if (!name?.trim()) throw { status: 400, message: 'Name is required' }
  if (code?.trim()) {
    const existing = await ProductCategory.findOne({ where: { code: code.trim(), createdBy: userId || null } })
    if (existing) throw { status: 400, message: 'Category code already exists' }
  }
  if (parentId) {
    const parent = await ProductCategory.findByPk(parentId)
    if (!parent) throw { status: 400, message: 'Parent category not found' }
    if (parent.parentId) throw { status: 400, message: 'Cannot nest more than one level deep' }
  }
  return ProductCategory.create({ code: code?.trim() || null, name: name.trim(), description, parentId: parentId || null, status, createdBy: userId || null })
}

const update = async (id, { code, name, description, parentId, status }, userId) => {
  const cat = await ProductCategory.findByPk(id)
  if (!cat) throw { status: 404, message: 'Product category not found' }
  if (code?.trim()) {
    const existing = await ProductCategory.findOne({ where: { code: code.trim(), createdBy: cat.createdBy } })
    if (existing && existing.id !== id) throw { status: 400, message: 'Category code already exists' }
  }
  if (parentId !== undefined && parentId) {
    if (parentId === id) throw { status: 400, message: 'Category cannot be its own parent' }
    const parent = await ProductCategory.findByPk(parentId)
    if (!parent) throw { status: 400, message: 'Parent category not found' }
    if (parent.parentId) throw { status: 400, message: 'Cannot nest more than one level deep' }
    // Prevent setting a parent to one of its own children
    const children = await ProductCategory.findAll({ where: { parentId: id } })
    if (children.some(c => c.id === parentId)) {
      throw { status: 400, message: 'Cannot set a child category as parent' }
    }
  }
  await cat.update({
    ...(code        !== undefined && { code: code?.trim() || null }),
    ...(name        !== undefined && { name: name.trim() }),
    ...(description !== undefined && { description }),
    ...(parentId    !== undefined && { parentId: parentId || null }),
    ...(status      !== undefined && { status }),
  })
  return getById(id)
}

const remove = async (id) => {
  const cat = await ProductCategory.findByPk(id)
  if (!cat) throw { status: 404, message: 'Product category not found' }
  const childCount = await ProductCategory.count({ where: { parentId: id } })
  if (childCount > 0) throw { status: 400, message: 'Cannot delete a category that has sub-categories' }
  await cat.destroy()
}

module.exports = { list, listAll, getById, create, update, remove }
