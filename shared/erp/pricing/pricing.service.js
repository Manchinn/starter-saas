const { Pricing, CustomerGroup } = require('../../../server/models')
const { Op } = require('sequelize')

const list = async ({ page = 1, limit = 20, search = '', status = '', customerGroupId = '' }) => {
  const offset = (page - 1) * limit
  const where = {}
  if (search) where.name = { [Op.like]: `%${search}%` }
  if (status) where.status = status
  if (customerGroupId) where.customerGroupId = customerGroupId

  const { count, rows } = await Pricing.findAndCountAll({
    where,
    include: [{ model: CustomerGroup, as: 'customerGroup', attributes: ['id', 'name'] }],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  })

  return { total: count, page, limit, pricings: rows }
}

const getById = async (id) => {
  const pricing = await Pricing.findByPk(id, {
    include: [{ model: CustomerGroup, as: 'customerGroup', attributes: ['id', 'name'] }],
  })
  if (!pricing) throw { status: 404, message: 'Pricing not found' }
  return pricing
}

const create = async ({ name, code, description, unitPrice, currency = 'USD', status = 'active', customerGroupId, autoCode, userId }) => {
  if (autoCode) {
    const seqSvc = require('../settings/sequence.service')
    code = await seqSvc.getNext('PRC', userId)
  } else if (code?.trim()) {
    const existing = await Pricing.findOne({ where: { code: code.trim(), createdBy: userId || null } })
    if (existing) throw { status: 400, message: 'Pricing code already exists' }
  }
  return Pricing.create({ name, code: code?.trim() || null, description, unitPrice, currency, status, customerGroupId: customerGroupId || null, createdBy: userId || null })
}

const update = async (id, { name, code, description, unitPrice, currency, status, customerGroupId }, userId) => {
  const pricing = await Pricing.findByPk(id)
  if (!pricing) throw { status: 404, message: 'Pricing not found' }
  if (code?.trim()) {
    const existing = await Pricing.findOne({ where: { code: code.trim(), createdBy: pricing.createdBy } })
    if (existing && existing.id !== id) throw { status: 400, message: 'Pricing code already exists' }
  }
  await pricing.update({
    ...(name !== undefined && { name }),
    ...(code !== undefined && { code: code?.trim() || null }),
    ...(description !== undefined && { description }),
    ...(unitPrice !== undefined && { unitPrice }),
    ...(currency !== undefined && { currency }),
    ...(status !== undefined && { status }),
    ...(customerGroupId !== undefined && { customerGroupId: customerGroupId || null }),
  })
  return pricing
}

const remove = async (id) => {
  const pricing = await Pricing.findByPk(id)
  if (!pricing) throw { status: 404, message: 'Pricing not found' }
  await pricing.destroy()
}

module.exports = { list, getById, create, update, remove }
