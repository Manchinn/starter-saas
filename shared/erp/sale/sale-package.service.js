const { SalePackage, SalePackageItem, SaleItem } = require('../../../server/models')
const { Op } = require('sequelize')
const sequelize = require('../../../server/config/database')

const itemInclude = {
  model: SalePackageItem,
  as: 'packageItems',
  include: [{ model: SaleItem, as: 'saleItem', attributes: ['id', 'code', 'name', 'status'] }],
  order: [['sortOrder', 'ASC']],
}

const list = async ({ page = 1, limit = 20, search = '', status = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (search) where[Op.or] = [
    { name: { [Op.like]: `%${search}%` } },
    { code: { [Op.like]: `%${search}%` } },
  ]
  if (status) where.status = status

  const { count, rows } = await SalePackage.findAndCountAll({
    where,
    include: [{ model: SalePackageItem, as: 'packageItems', attributes: ['id'] }],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    distinct: true,
  })

  return { total: count, page, limit, items: rows }
}

const getById = async (id) => {
  const pkg = await SalePackage.findByPk(id, {
    include: [itemInclude],
  })
  if (!pkg) throw { status: 404, message: 'Sale package not found' }
  return pkg
}

const create = async ({ code, name, description, status = 'active', autoCode, items = [], userId, organizationId }) => {
  if (autoCode) {
    const seqSvc = require('../settings/sequence.service')
    code = await seqSvc.getNext('PKG', userId)
  } else if (code?.trim()) {
    const existing = await SalePackage.findOne({ where: { code: code.trim(), organizationId: organizationId || null } })
    if (existing) throw { status: 400, message: 'Package code already exists' }
  }

  return sequelize.transaction(async (t) => {
    const pkg = await SalePackage.create({
      code:           code?.trim() || null,
      name,
      description:    description || null,
      status,
      organizationId: organizationId || null,
      createdBy:      userId || null,
    }, { transaction: t })

    if (items.length) {
      await SalePackageItem.bulkCreate(
        items.map((item, idx) => ({
          packageId:  pkg.id,
          saleItemId: item.saleItemId,
          quantity:   item.quantity || 1,
          unitPrice:  item.unitPrice != null ? item.unitPrice : null,
          sortOrder:  item.sortOrder ?? idx,
          notes:      item.notes || null,
        })),
        { transaction: t }
      )
    }

    return getById(pkg.id)
  })
}

const update = async (id, { code, name, description, status, items }, userId) => {
  const pkg = await SalePackage.findByPk(id)
  if (!pkg) throw { status: 404, message: 'Sale package not found' }

  if (code?.trim() && code.trim() !== pkg.code) {
    const existing = await SalePackage.findOne({ where: { code: code.trim() } })
    if (existing) throw { status: 400, message: 'Package code already exists' }
  }

  return sequelize.transaction(async (t) => {
    await pkg.update({
      ...(code        !== undefined && { code: code?.trim() || null }),
      ...(name        !== undefined && { name }),
      ...(description !== undefined && { description: description || null }),
      ...(status      !== undefined && { status }),
      modifiedBy: userId || null,
    }, { transaction: t })

    if (Array.isArray(items)) {
      await SalePackageItem.destroy({ where: { packageId: id }, transaction: t })
      if (items.length) {
        await SalePackageItem.bulkCreate(
          items.map((item, idx) => ({
            packageId:  id,
            saleItemId: item.saleItemId,
            quantity:   item.quantity || 1,
            sortOrder:  item.sortOrder ?? idx,
            notes:      item.notes || null,
          })),
          { transaction: t }
        )
      }
    }

    return getById(id)
  })
}

const remove = async (id) => {
  const pkg = await SalePackage.findByPk(id)
  if (!pkg) throw { status: 404, message: 'Sale package not found' }
  await pkg.destroy()
}

module.exports = { list, getById, create, update, remove }
