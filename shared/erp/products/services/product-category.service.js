const { ProductCategory } = require('../../../../server/models')
const { Op } = require('sequelize')
const { findByPkScoped } = require('../../../../server/core/tenant')

const parentInclude = { model: ProductCategory, as: 'parent', attributes: ['id', 'name'] }

const list = async ({ page = 1, limit = 20, search = '', status = '', activeFrom = '', activeTo = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (search) where.name = { [Op.like]: `%${search}%` }
  if (status) where.status = status
  if (activeFrom) where.activeFrom = { [Op.gte]: activeFrom }
  if (activeTo) where.activeTo = { [Op.lte]: activeTo }
  const { count, rows } = await ProductCategory.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    include: [parentInclude],
    distinct: true,
  })
  return { total: count, page, limit, categories: rows }
}

const listAll = async (organizationId) => {
  return ProductCategory.findAll({
    where: { status: 'active', organizationId: organizationId || null },
    attributes: ['id', 'name', 'parentId'],
    order: [['name', 'DESC']],
  })
}

const getById = async (id, organizationId) => {
  const cat = await findByPkScoped(ProductCategory, id, organizationId, {
    include: [
      parentInclude,
      { model: ProductCategory, as: 'children', attributes: ['id', 'name', 'status'] },
    ],
  })
  if (!cat) throw { status: 404, message: 'Product category not found' }
  return cat
}

const create = async ({ code, name, description, parentId, status = 'active', activeFrom, activeTo, autoCode, userId, organizationId }) => {
  if (!name?.trim()) throw { status: 400, message: 'Name is required' }
  if (autoCode) {
    const seqSvc = require('../../settings/services/sequence.service')
    code = await seqSvc.getNext('CAT', userId)
  } else if (code?.trim()) {
    const existing = await ProductCategory.findOne({ where: { code: code.trim(), organizationId: organizationId || null } })
    if (existing) throw { status: 400, message: 'Category code already exists' }
  }
  if (parentId) {
    const parent = await ProductCategory.findByPk(parentId)
    if (!parent) throw { status: 400, message: 'Parent category not found' }
    if (parent.parentId) throw { status: 400, message: 'Cannot nest more than one level deep' }
  }
  return ProductCategory.create({ code: code?.trim() || null, name: name.trim(), description, parentId: parentId || null, status, activeFrom: activeFrom || null, activeTo: activeTo || null, organizationId: organizationId || null, createdBy: userId || null })
}

const update = async (id, { code, name, description, parentId, status, activeFrom, activeTo }, userId, organizationId) => {
  const cat = await findByPkScoped(ProductCategory, id, organizationId)
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
    ...(activeFrom  !== undefined && { activeFrom: activeFrom || null }),
    ...(activeTo    !== undefined && { activeTo: activeTo || null }),
    modifiedBy: userId || null,
  })
  return getById(id) // re-read of the row we just updated (already org-verified above)
}

const remove = async (id, organizationId) => {
  const cat = await findByPkScoped(ProductCategory, id, organizationId)
  if (!cat) throw { status: 404, message: 'Product category not found' }
  const childCount = await ProductCategory.count({ where: { parentId: id } })
  if (childCount > 0) throw { status: 400, message: 'Cannot delete a category that has sub-categories' }
  await cat.destroy()
}

module.exports = { list, listAll, getById, create, update, remove }
