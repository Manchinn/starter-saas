const { PurchaseOrder, PurchaseOrderItem, Product, Vendor, PurchaseRequisition } = require('../../../../server/models')
const { Op } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { getNext } = require('../../settings/services/sequence.service')

const productAttrs = ['id', 'name', 'sku']
const vendorAttrs  = ['id', 'name', 'code']

const itemInclude = {
  model: PurchaseOrderItem,
  as: 'items',
  include: [{ model: Product, as: 'product', attributes: productAttrs }],
}

const nextRefNo = (userId) => getNext('PO', userId)

const list = async ({ page = 1, limit = 20, search = '', status = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where  = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (search) {
    where[Op.or] = [
      { refNo: { [Op.like]: `%${search}%` } },
      { notes: { [Op.like]: `%${search}%` } },
    ]
  }
  if (status) where.status = status

  const { count, rows } = await PurchaseOrder.findAndCountAll({
    where, limit, offset,
    order: [['createdAt', 'DESC']],
    include: [{ model: Vendor, as: 'vendor', attributes: vendorAttrs }],
    distinct: true,
  })
  return { total: count, page, limit, orders: rows }
}

const getById = async (id) => {
  const po = await PurchaseOrder.findByPk(id, {
    include: [
      itemInclude,
      { model: Vendor, as: 'vendor', attributes: vendorAttrs },
      { model: PurchaseRequisition, as: 'requisition', attributes: ['id', 'refNo'] },
    ],
  })
  if (!po) throw { status: 404, message: 'Purchase Order not found' }

  const { GoodReceive } = require('../../../../server/models')
  const linkedGR = await GoodReceive.findOne({
    where: { purchaseOrderId: id, dataFlag: { [Op.ne]: 2 } },
    attributes: ['id', 'refNo', 'status'],
  })
  const json = po.toJSON()
  json.linkedGoodReceive = linkedGR
  return json
}

const create = async ({ date, deliveryDate, vendorId, requisitionId, notes, items = [], currency, exchangeRate, userId, organizationId }) => {
  if (!date)     throw { status: 400, message: 'Date is required' }
  if (!vendorId) throw { status: 400, message: 'Vendor is required' }
  if (!items.length) throw { status: 400, message: 'At least one item is required' }

  const vendor = await Vendor.findByPk(vendorId)
  if (!vendor) throw { status: 400, message: 'Vendor not found' }

  const refNo = await nextRefNo(userId)
  const fx = await require('../../settings/services/currency.service').getRateOn(currency, date, organizationId)
  const resolvedRate = exchangeRate != null && Number(exchangeRate) > 0 ? Number(exchangeRate) : fx
  const t = await sequelize.transaction()
  try {
    const po = await PurchaseOrder.create(
      { refNo, date, deliveryDate: deliveryDate || null, vendorId,
        requisitionId: requisitionId || null, notes: notes || null,
        currency: currency || null, exchangeRate: resolvedRate,
        organizationId: organizationId || null, createdBy: userId || null, modifiedBy: userId || null },
      { transaction: t },
    )
    for (const item of items) {
      if (!item.productId && !item.description) throw { status: 400, message: 'Each item needs a product or description' }
      if (!item.qty || Number(item.qty) <= 0)   throw { status: 400, message: 'Quantity must be greater than 0' }
      if (Number(item.unitPrice) < 0)            throw { status: 400, message: 'Unit price cannot be negative' }
      await PurchaseOrderItem.create(
        { purchaseOrderId: po.id, productId: item.productId || null,
          description: item.description || null, qty: item.qty,
          unitPrice: item.unitPrice ?? 0, notes: item.notes || null,
          organizationId: organizationId || null },
        { transaction: t },
      )
    }
    await t.commit()
    return getById(po.id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

// Edit a draft purchase order. Header + items both replaced atomically;
// mirrors create()'s validation so the saved doc stays consistent. Editing
// a confirmed/received PO would invalidate downstream Good Receives, so we
// block it.
const update = async (id, { date, deliveryDate, vendorId, requisitionId, notes, items = [], currency, exchangeRate, userId }) => {
  const po = await PurchaseOrder.findByPk(id)
  if (!po)                   throw { status: 404, message: 'Purchase Order not found' }
  if (po.status !== 'draft') throw { status: 400, message: 'Only draft orders can be edited' }
  if (!date)         throw { status: 400, message: 'Date is required' }
  if (!vendorId)     throw { status: 400, message: 'Vendor is required' }
  if (!items.length) throw { status: 400, message: 'At least one item is required' }

  const vendor = await Vendor.findByPk(vendorId)
  if (!vendor) throw { status: 400, message: 'Vendor not found' }

  const headerExtras = {}
  if (currency !== undefined) headerExtras.currency = currency || null
  if (currency !== undefined || exchangeRate !== undefined) {
    const fx = await require('../../settings/services/currency.service').getRateOn(currency, date, po.organizationId)
    headerExtras.exchangeRate = exchangeRate != null && Number(exchangeRate) > 0 ? Number(exchangeRate) : fx
  }

  const t = await sequelize.transaction()
  try {
    await po.update({
      date,
      deliveryDate:  deliveryDate  || null,
      vendorId,
      requisitionId: requisitionId || null,
      notes:         notes         || null,
      ...headerExtras,
      modifiedBy:    userId || null,
    }, { transaction: t })

    // Replace items wholesale — drafts have no downstream side effects.
    await PurchaseOrderItem.destroy({ where: { purchaseOrderId: po.id }, transaction: t })
    for (const item of items) {
      if (!item.productId && !item.description) throw { status: 400, message: 'Each item needs a product or description' }
      if (!item.qty || Number(item.qty) <= 0)   throw { status: 400, message: 'Quantity must be greater than 0' }
      if (Number(item.unitPrice) < 0)            throw { status: 400, message: 'Unit price cannot be negative' }
      await PurchaseOrderItem.create(
        { purchaseOrderId: po.id, productId: item.productId || null,
          description: item.description || null, qty: item.qty,
          unitPrice: item.unitPrice ?? 0, notes: item.notes || null,
          organizationId: po.organizationId },
        { transaction: t },
      )
    }
    await t.commit()
    return getById(id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const confirm = async (id, userId, user) => {
  const po = await PurchaseOrder.findByPk(id, {
    include: [{ model: PurchaseOrderItem, as: 'items' }],
  })
  if (!po)                    throw { status: 404, message: 'Purchase Order not found' }
  if (po.status !== 'draft')  throw { status: 400, message: 'Only draft orders can be confirmed' }

  if (user) {
    const total = po.items.reduce((s, i) => s + Number(i.qty || 0) * Number(i.unitPrice || 0), 0)
    const thresholds = require('../../settings/services/approval-threshold.service')
    await thresholds.enforce({ user, docType: 'purchase_order', amount: total, organizationId: po.organizationId })
  }

  await po.update({ status: 'confirmed', modifiedBy: userId || null })
  require('../../audit/audit.service').log({ userId, action: 'po.confirm', entityType: 'PurchaseOrder', entityId: id, summary: { refNo: po.refNo } })
  return getById(id)
}

const receive = async (id, userId) => {
  const po = await PurchaseOrder.findByPk(id)
  if (!po)                        throw { status: 404, message: 'Purchase Order not found' }
  if (po.status !== 'confirmed')  throw { status: 400, message: 'Only confirmed orders can be marked as received' }
  await po.update({ status: 'received', modifiedBy: userId || null })
  require('../../audit/audit.service').log({ userId, action: 'po.receive', entityType: 'PurchaseOrder', entityId: id, summary: { refNo: po.refNo } })
  return getById(id)
}

const cancel = async (id, userId) => {
  const po = await PurchaseOrder.findByPk(id)
  if (!po)                          throw { status: 404, message: 'Purchase Order not found' }
  if (po.status === 'received')     throw { status: 400, message: 'Received orders cannot be cancelled' }
  if (po.status === 'cancelled')    throw { status: 400, message: 'Already cancelled' }
  await po.update({ status: 'cancelled', modifiedBy: userId || null })
  require('../../audit/audit.service').log({ userId, action: 'po.cancel', entityType: 'PurchaseOrder', entityId: id, summary: { refNo: po.refNo } })
  return getById(id)
}

const remove = async (id) => {
  const po = await PurchaseOrder.findByPk(id)
  if (!po)                    throw { status: 404, message: 'Purchase Order not found' }
  if (po.status !== 'draft')  throw { status: 400, message: 'Only draft orders can be deleted' }
  await po.destroy()
}

const createGoodReceive = async (id, userId, organizationId, { storeId } = {}) => {
  const po = await getById(id)
  if (!['confirmed', 'received'].includes(po.status)) {
    throw { status: 400, message: 'Only confirmed or received purchase orders can generate a Good Receive' }
  }
  const productItems = po.items.filter(i => i.productId)
  if (!productItems.length) throw { status: 400, message: 'Purchase order has no product items to receive' }

  const { GoodReceive } = require('../../../../server/models')
  const existing = await GoodReceive.findOne({
    where: { purchaseOrderId: po.id, dataFlag: { [Op.ne]: 2 } },
    attributes: ['id', 'refNo'],
  })
  if (existing) throw { status: 400, message: `Good Receive ${existing.refNo} already exists for this purchase order. Delete it first to create a new one.` }

  // Pick a store: caller-supplied wins, else fall back to first active Store
  let resolvedStoreId = storeId
  if (!resolvedStoreId) {
    const { Store } = require('../../../../server/models')
    const firstStore = await Store.findOne({ where: { organizationId: organizationId || null }, order: [['createdAt', 'ASC']] })
    if (!firstStore) throw { status: 400, message: 'No store available — create a store before generating a Good Receive' }
    resolvedStoreId = firstStore.id
  }

  const grSvc = require('../../stock/good-receive/good-receive.service')
  const subtotal = po.items.reduce((sum, i) => sum + Number(i.qty || 0) * Number(i.unitPrice || 0), 0)
  const gr = await grSvc.create({
    date:             new Date().toISOString().slice(0, 10),
    supplier:         po.vendor?.name || null,
    storeId:          resolvedStoreId,
    purchaseOrderId:  po.id,
    notes:            `Auto-created from Purchase Order ${po.refNo}`,
    docType:          'invoice',
    invoiceNo:        `PO-${po.refNo}`,
    invoiceDate:      new Date().toISOString().slice(0, 10),
    invoiceNetAmount: subtotal,
    items: productItems.map(i => ({
      productId: i.productId,
      qty:       i.qty,
      cost:      i.unitPrice,
      discount:  0,
      discountPct: 0,
    })),
    userId,
    organizationId,
  })
  return { id: gr.id }
}

module.exports = { list, getById, create, update, confirm, receive, cancel, remove, createGoodReceive }
