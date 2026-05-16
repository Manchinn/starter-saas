const { PurchaseRequisition, PurchaseRequisitionItem, PurchaseOrder, Product, Vendor } = require('../../../server/models')
const { Op } = require('sequelize')
const sequelize = require('../../../server/config/database')
const { getNext } = require('../settings/sequence.service')

const productAttrs = ['id', 'name', 'sku']
const vendorAttrs  = ['id', 'name', 'code']

const itemInclude = {
  model: PurchaseRequisitionItem,
  as: 'items',
  include: [{ model: Product, as: 'product', attributes: productAttrs }],
}

const nextRefNo = (userId) => getNext('PR', userId)

const list = async ({ page = 1, limit = 20, search = '', status = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (search) {
    where[Op.or] = [
      { refNo:        { [Op.like]: `%${search}%` } },
      { requestedBy:  { [Op.like]: `%${search}%` } },
      { department:   { [Op.like]: `%${search}%` } },
    ]
  }
  if (status) where.status = status

  const { count, rows } = await PurchaseRequisition.findAndCountAll({
    where, limit, offset,
    order: [['createdAt', 'DESC']],
    include: [{ model: Vendor, as: 'vendor', attributes: vendorAttrs }],
    distinct: true,
  })
  return { total: count, page, limit, requisitions: rows }
}

const getById = async (id) => {
  const req = await PurchaseRequisition.findByPk(id, {
    include: [
      itemInclude,
      { model: Vendor, as: 'vendor', attributes: vendorAttrs },
    ],
  })
  if (!req) throw { status: 404, message: 'Purchase Requisition not found' }
  return req
}

const create = async ({ date, requestedBy, department, vendorId, notes, items = [], currency, exchangeRate, userId, organizationId }) => {
  if (!date)         throw { status: 400, message: 'Date is required' }
  if (!items.length) throw { status: 400, message: 'At least one item is required' }

  const refNo = await nextRefNo(userId)
  const fx = await require('../settings/currency.service').getRateOn(currency, date, organizationId)
  const resolvedRate = exchangeRate != null && Number(exchangeRate) > 0 ? Number(exchangeRate) : fx
  const t = await sequelize.transaction()
  try {
    const req = await PurchaseRequisition.create(
      { refNo, date, requestedBy: requestedBy || null, department: department || null,
        vendorId: vendorId || null, notes: notes || null,
        currency: currency || null, exchangeRate: resolvedRate,
        organizationId: organizationId || null, createdBy: userId || null, modifiedBy: userId || null },
      { transaction: t },
    )
    for (const item of items) {
      if (!item.productId && !item.description) throw { status: 400, message: 'Each item needs a product or description' }
      if (!item.qty || Number(item.qty) <= 0)   throw { status: 400, message: 'Quantity must be greater than 0' }
      await PurchaseRequisitionItem.create(
        { requisitionId: req.id, productId: item.productId || null, description: item.description || null,
          qty: item.qty, unitPrice: item.unitPrice || null, notes: item.notes || null,
          organizationId: organizationId || null },
        { transaction: t },
      )
    }
    await t.commit()
    return getById(req.id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const approve = async (id, userId) => {
  const req = await PurchaseRequisition.findByPk(id)
  if (!req)                       throw { status: 404, message: 'Purchase Requisition not found' }
  if (req.status !== 'draft')     throw { status: 400, message: 'Only draft requisitions can be approved' }
  await req.update({ status: 'approved', modifiedBy: userId || null })
  require('../audit/audit.service').log({ userId, action: 'pr.approve', entityType: 'PurchaseRequisition', entityId: id, summary: { refNo: req.refNo } })
  return getById(id)
}

const reject = async (id, userId) => {
  const req = await PurchaseRequisition.findByPk(id)
  if (!req)                       throw { status: 404, message: 'Purchase Requisition not found' }
  if (req.status !== 'draft')     throw { status: 400, message: 'Only draft requisitions can be rejected' }
  await req.update({ status: 'rejected', modifiedBy: userId || null })
  require('../audit/audit.service').log({ userId, action: 'pr.reject', entityType: 'PurchaseRequisition', entityId: id, summary: { refNo: req.refNo } })
  return getById(id)
}

const remove = async (id) => {
  const req = await PurchaseRequisition.findByPk(id)
  if (!req)                       throw { status: 404, message: 'Purchase Requisition not found' }
  if (req.status !== 'draft')     throw { status: 400, message: 'Cannot delete an approved or rejected requisition' }
  await req.destroy()
}

const listOrders = async (requisitionId) => {
  return PurchaseOrder.findAll({
    where: { requisitionId },
    include: [{ model: Vendor, as: 'vendor', attributes: vendorAttrs }],
    order: [['createdAt', 'DESC']],
  })
}

const createOrder = async (id, userId, organizationId) => {
  const req = await getById(id)
  if (req.status !== 'approved') throw { status: 400, message: 'Only approved requisitions can be converted to a purchase order' }
  if (!req.vendorId)             throw { status: 400, message: 'Requisition has no vendor — set a vendor before converting' }
  if (!req.items?.length)        throw { status: 400, message: 'Requisition has no items' }

  const existing = await PurchaseOrder.findOne({
    where: { requisitionId: req.id, dataFlag: { [Op.ne]: 2 } },
    attributes: ['id', 'refNo'],
  })
  if (existing) throw { status: 400, message: `Purchase order ${existing.refNo} already exists for this requisition. Cancel it first to create a new one.` }

  const poSvc = require('./purchase-order.service')
  const po = await poSvc.create({
    date:          new Date().toISOString().slice(0, 10),
    vendorId:      req.vendorId,
    requisitionId: req.id,
    notes:         `Auto-created from Purchase Requisition ${req.refNo}`,
    items: req.items.map(i => ({
      productId:   i.productId || null,
      description: i.description || i.product?.name || null,
      qty:         i.qty,
      unitPrice:   i.unitPrice ?? 0,
      notes:       i.notes || null,
    })),
    userId,
    organizationId,
  })
  return { id: po.id }
}

module.exports = { list, getById, create, approve, reject, remove, listOrders, createOrder }
