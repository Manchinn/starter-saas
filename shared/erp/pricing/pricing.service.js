const { Pricing, CustomerGroup, SaleItem } = require('../../../server/models')
const { Op } = require('sequelize')
const { findByPkScoped } = require('../../../server/core/tenant')

const list = async ({ page = 1, limit = 20, search = '', status = '', customerGroupId = '', activeFrom = '', activeTo = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (search) where.name = { [Op.like]: `%${search}%` }
  if (status) where.status = status
  if (customerGroupId) where.customerGroupId = customerGroupId
  if (activeFrom) where.activeFrom = { [Op.gte]: activeFrom }
  if (activeTo) where.activeTo = { [Op.lte]: activeTo }

  const { count, rows } = await Pricing.findAndCountAll({
    where,
    include: [{ model: CustomerGroup, as: 'customerGroup', attributes: ['id', 'name'] }],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  })

  return { total: count, page, limit, pricings: rows }
}

const getById = async (id, organizationId) => {
  const pricing = await findByPkScoped(Pricing, id, organizationId, {
    include: [
      { model: CustomerGroup, as: 'customerGroup', attributes: ['id', 'name'] },
      { model: SaleItem,      as: 'saleItem',      attributes: ['id', 'code', 'name'] },
    ],
  })
  if (!pricing) throw { status: 404, message: 'Pricing not found' }
  return pricing
}

const create = async ({ name, code, description, unitPrice, currency = 'USD', status = 'active', activeFrom, activeTo, saleItemId, customerGroupId, autoCode, userId, organizationId }) => {
  if (autoCode) {
    const seqSvc = require('../settings/services/sequence.service')
    code = await seqSvc.getNext('PRC', userId)
  } else if (code?.trim()) {
    const existing = await Pricing.findOne({ where: { code: code.trim(), organizationId: organizationId || null } })
    if (existing) throw { status: 400, message: 'Pricing code already exists' }
  }
  return Pricing.create({ name, code: code?.trim() || null, description, unitPrice, currency, status, activeFrom: activeFrom || null, activeTo: activeTo || null, saleItemId: saleItemId || null, customerGroupId: customerGroupId || null, organizationId: organizationId || null, createdBy: userId || null })
}

const update = async (id, { name, code, description, unitPrice, currency, status, activeFrom, activeTo, saleItemId, customerGroupId }, userId, organizationId) => {
  const pricing = await findByPkScoped(Pricing, id, organizationId)
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
    ...(status      !== undefined && { status }),
    ...(saleItemId  !== undefined && { saleItemId: saleItemId || null }),
    ...(customerGroupId !== undefined && { customerGroupId: customerGroupId || null }),
    ...(activeFrom !== undefined && { activeFrom: activeFrom || null }),
    ...(activeTo   !== undefined && { activeTo: activeTo || null }),
    modifiedBy: userId || null,
  })
  return pricing
}

const remove = async (id, organizationId) => {
  const pricing = await findByPkScoped(Pricing, id, organizationId)
  if (!pricing) throw { status: 404, message: 'Pricing not found' }
  await pricing.destroy()
}

module.exports = { list, getById, create, update, remove }
