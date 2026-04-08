const { SaleItem, Product, Pricing } = require('../../../server/models')
const { Op } = require('sequelize')

const includes = [
  { model: Product, as: 'product', attributes: ['id', 'name', 'sku'] },
  { model: Pricing, as: 'pricings', attributes: ['id', 'name', 'unitPrice', 'currency', 'customerGroupId'] },
]

const list = async ({ page = 1, limit = 20, search = '', status = '' }) => {
  const offset = (page - 1) * limit
  const where = {}
  if (search) where[Op.or] = [
    { name: { [Op.like]: `%${search}%` } },
    { code: { [Op.like]: `%${search}%` } },
  ]
  if (status) where.status = status

  const { count, rows } = await SaleItem.findAndCountAll({
    where,
    include: includes,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  })

  return { total: count, page, limit, items: rows }
}

const getById = async (id) => {
  const item = await SaleItem.findByPk(id, { include: includes })
  if (!item) throw { status: 404, message: 'Sale item not found' }
  return item
}

const create = async ({ code, name, productId, status = 'active', autoCode, userId }) => {
  if (autoCode) {
    const seqSvc = require('../settings/sequence.service')
    code = await seqSvc.getNext('SI', userId)
  } else if (code?.trim()) {
    const existing = await SaleItem.findOne({ where: { code: code.trim() } })
    if (existing) throw { status: 400, message: 'Sale item code already exists' }
  }

  const item = await SaleItem.create({
    code:      code?.trim() || null,
    name,
    productId: productId || null,
    status,
    createdBy: userId || null,
  })
  return getById(item.id)
}

const update = async (id, { code, name, productId, status }) => {
  const item = await SaleItem.findByPk(id)
  if (!item) throw { status: 404, message: 'Sale item not found' }

  if (code?.trim() && code.trim() !== item.code) {
    const existing = await SaleItem.findOne({ where: { code: code.trim() } })
    if (existing) throw { status: 400, message: 'Sale item code already exists' }
  }

  await item.update({
    ...(code      !== undefined && { code: code?.trim() || null }),
    ...(name      !== undefined && { name }),
    ...(productId !== undefined && { productId: productId || null }),
    ...(status    !== undefined && { status }),
  })
  return getById(id)
}

const remove = async (id) => {
  const item = await SaleItem.findByPk(id)
  if (!item) throw { status: 404, message: 'Sale item not found' }
  await item.destroy()
}

module.exports = { list, getById, create, update, remove }
