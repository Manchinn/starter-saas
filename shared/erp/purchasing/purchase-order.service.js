const { PurchaseOrder, PurchaseOrderItem, Product, Vendor, PurchaseRequisition } = require('../../../server/models')
const { Op } = require('sequelize')
const sequelize = require('../../../server/config/database')
const { getNext } = require('../settings/sequence.service')

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
  return po
}

const create = async ({ date, deliveryDate, vendorId, requisitionId, notes, items = [], userId, organizationId }) => {
  if (!date)     throw { status: 400, message: 'Date is required' }
  if (!vendorId) throw { status: 400, message: 'Vendor is required' }
  if (!items.length) throw { status: 400, message: 'At least one item is required' }

  const vendor = await Vendor.findByPk(vendorId)
  if (!vendor) throw { status: 400, message: 'Vendor not found' }

  const refNo = await nextRefNo(userId)
  const t = await sequelize.transaction()
  try {
    const po = await PurchaseOrder.create(
      { refNo, date, deliveryDate: deliveryDate || null, vendorId,
        requisitionId: requisitionId || null, notes: notes || null,
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

const confirm = async (id, userId) => {
  const po = await PurchaseOrder.findByPk(id)
  if (!po)                    throw { status: 404, message: 'Purchase Order not found' }
  if (po.status !== 'draft')  throw { status: 400, message: 'Only draft orders can be confirmed' }
  await po.update({ status: 'confirmed', modifiedBy: userId || null })
  return getById(id)
}

const receive = async (id, userId) => {
  const po = await PurchaseOrder.findByPk(id)
  if (!po)                        throw { status: 404, message: 'Purchase Order not found' }
  if (po.status !== 'confirmed')  throw { status: 400, message: 'Only confirmed orders can be marked as received' }
  await po.update({ status: 'received', modifiedBy: userId || null })
  return getById(id)
}

const cancel = async (id, userId) => {
  const po = await PurchaseOrder.findByPk(id)
  if (!po)                          throw { status: 404, message: 'Purchase Order not found' }
  if (po.status === 'received')     throw { status: 400, message: 'Received orders cannot be cancelled' }
  if (po.status === 'cancelled')    throw { status: 400, message: 'Already cancelled' }
  await po.update({ status: 'cancelled', modifiedBy: userId || null })
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

  // Pick a store: caller-supplied wins, else fall back to first active Store
  let resolvedStoreId = storeId
  if (!resolvedStoreId) {
    const { Store } = require('../../../server/models')
    const firstStore = await Store.findOne({ where: { organizationId: organizationId || null }, order: [['createdAt', 'ASC']] })
    if (!firstStore) throw { status: 400, message: 'No store available — create a store before generating a Good Receive' }
    resolvedStoreId = firstStore.id
  }

  const grSvc = require('../stock/good-receive/good-receive.service')
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

module.exports = { list, getById, create, confirm, receive, cancel, remove, createGoodReceive }
