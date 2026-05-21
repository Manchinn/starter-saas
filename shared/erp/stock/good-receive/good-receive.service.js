const { GoodReceive, GoodReceiveItem, Product, Store, StoreStock, StockMovement, UOM, UOMConversion } = require('../../../../server/models')
const { Op } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { toFixed } = require('../../../../server/utils/fmt')
const { getNext } = require('../../settings/sequence.service')

/**
 * Convert a quantity from a given UOM to its base (stock) UOM using UOMConversion.
 * Returns qty as-is if no conversion rule exists for the given UOM.
 */
async function toStockQty(qty, uomId) {
  const q = parseFloat(qty) || 0
  if (!uomId || !q) return q
  const conv = await UOMConversion.findOne({ where: { fromUomId: uomId } })
  if (!conv) return q
  return toFixed(q * parseFloat(conv.factor), 4)
}

const productAttrs = ['id', 'name', 'sku', 'stock', 'unit']

const itemInclude = {
  model: GoodReceiveItem,
  as: 'items',
  include: [
    { model: Product, as: 'product', attributes: productAttrs },
    { model: UOM, as: 'qtyUom',     attributes: ['id', 'name', 'abbreviation'] },
    { model: UOM, as: 'freeQtyUom', attributes: ['id', 'name', 'abbreviation'] },
  ],
}

const storeInclude = { model: Store, as: 'store', attributes: ['id', 'name', 'code'] }

const nextRefNo = (userId) => getNext('GR', userId)

// Calculate WAC: total cost value / total received qty (inc. free)
function calcWac(qty, cost, freeQty) {
  const totalQty = parseFloat(qty || 0) + parseFloat(freeQty || 0)
  if (!totalQty) return 0
  return toFixed((parseFloat(qty || 0) * parseFloat(cost || 0)) / totalQty, 4)
}

function calcNetAmount(qty, cost, discountPct, discount) {
  const gross = parseFloat(qty || 0) * parseFloat(cost || 0)
  const afterPct = gross * (1 - parseFloat(discountPct || 0) / 100)
  return toFixed(afterPct - parseFloat(discount || 0), 2)
}

const list = async ({ page = 1, limit = 20, search = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where = search
    ? { [Op.or]: [{ refNo: { [Op.like]: `%${search}%` } }, { supplier: { [Op.like]: `%${search}%` } }], organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
    : { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  const { count, rows } = await GoodReceive.findAndCountAll({
    where, limit, offset,
    order: [['createdAt', 'DESC']],
    include: [storeInclude],
    distinct: true,
  })
  return { total: count, page, limit, goodReceives: rows }
}

const getById = async (id) => {
  const gr = await GoodReceive.findByPk(id, { include: [itemInclude, storeInclude] })
  if (!gr) throw { status: 404, message: 'Good Receive not found' }

  const { VendorBill, PurchaseOrder } = require('../../../../server/models')
  const [linkedBill, sourcePO] = await Promise.all([
    VendorBill.findOne({ where: { goodReceiveId: id, dataFlag: { [Op.ne]: 2 } }, attributes: ['id', 'billNumber', 'status'] }),
    gr.purchaseOrderId
      ? PurchaseOrder.findByPk(gr.purchaseOrderId, { attributes: ['id', 'refNo'] })
      : null,
  ])
  const json = gr.toJSON()
  json.linkedBill     = linkedBill
  json.purchaseOrder  = sourcePO
  return json
}

const create = async ({ date, supplier, storeId, purchaseOrderId, notes, docType = 'invoice', invoiceNo, invoiceDate, deliveryNo, invoiceDiscount, invoiceNetAmount, items = [], userId, organizationId }) => {
  if (!date) throw { status: 400, message: 'Date is required' }
  if (!storeId) throw { status: 400, message: 'Store is required' }
  if (!items.length) throw { status: 400, message: 'At least one item is required' }

  if (docType === 'invoice' && !invoiceNo?.trim())
    throw { status: 400, message: 'Invoice Number is required' }
  if (docType === 'delivery' && !deliveryNo?.trim())
    throw { status: 400, message: 'Delivery Number is required' }

  const store = await Store.findByPk(storeId)
  if (!store) throw { status: 400, message: 'Store not found' }
  const refNo = await nextRefNo(userId)
  const t = await sequelize.transaction()
  try {
    const gr = await GoodReceive.create({
      refNo, date, supplier, storeId, notes,
      purchaseOrderId: purchaseOrderId || null,
      docType:          docType || 'invoice',
      invoiceNo:        docType === 'invoice'  ? (invoiceNo  || null) : null,
      invoiceDate:      docType === 'invoice'  ? (invoiceDate || null) : null,
      deliveryNo:       docType === 'delivery' ? (deliveryNo  || null) : null,
      invoiceDiscount:  docType === 'invoice'  ? (parseFloat(invoiceDiscount)  || 0) : 0,
      invoiceNetAmount: docType === 'invoice'  ? (parseFloat(invoiceNetAmount) || 0) : 0,
      organizationId: organizationId || null,
      createdBy: userId || null, modifiedBy: userId || null,
    }, { transaction: t })
    for (const item of items) {
      if (!item.productId) throw { status: 400, message: 'Product is required on all items' }
      if (!item.qty || item.qty <= 0) throw { status: 400, message: 'Quantity must be greater than 0' }

      const wac       = calcWac(item.qty, item.cost, item.freeQty)
      const netAmount = calcNetAmount(item.qty, item.cost, item.discountPct, item.discount)

      // Convert GR qty → stock UOM qty using UOM Conversion rules
      const convertedQty     = await toStockQty(item.qty,     item.qtyUomId)
      const convertedFreeQty = await toStockQty(item.freeQty, item.freeQtyUomId)
      const stockQty         = toFixed(parseFloat(convertedQty) + parseFloat(convertedFreeQty), 4)

      await GoodReceiveItem.create({
        goodReceiveId:  gr.id,
        organizationId: organizationId || null,
        productId:     item.productId,
        qty:           item.qty,
        qtyUomId:      item.qtyUomId     || null,
        freeQty:       item.freeQty      || 0,
        freeQtyUomId:  item.freeQtyUomId || null,
        batchId:       item.batchId      || null,
        expiryDate:    item.expiryDate   || null,
        cost:          item.cost         || 0,
        discount:      item.discount     || 0,
        discountPct:   item.discountPct  || 0,
        netAmount,
        wac,
        stockQty,
        comments:      item.comments     || null,
      }, { transaction: t })
    }
    await t.commit()
    return getById(gr.id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const confirm = async (id) => {
  const gr = await GoodReceive.findByPk(id, { include: [itemInclude] })
  if (!gr) throw { status: 404, message: 'Good Receive not found' }
  if (gr.status === 'confirmed') throw { status: 400, message: 'Already confirmed' }
  if (!gr.storeId) throw { status: 400, message: 'Store is required before confirming' }
  const { checkStoreLock } = require('../stock-count/stock-count.service')
  await checkStoreLock(gr.storeId)

  const t = await sequelize.transaction()
  try {
    for (const item of gr.items) {
      // Use pre-computed stockQty (UOM-converted). Fall back to raw qty+freeQty for old records.
      const receiveQty = parseFloat(item.stockQty) > 0
        ? parseFloat(item.stockQty)
        : parseFloat(item.qty) + parseFloat(item.freeQty || 0)
      const product = await Product.findByPk(item.productId, { transaction: t })
      const before = product.stock
      const after  = before + receiveQty

      await product.update({ stock: after }, { transaction: t })

      const [storeStock] = await StoreStock.findOrCreate({
        where: { productId: item.productId, storeId: gr.storeId },
        defaults: { stock: 0 },
        transaction: t,
      })
      await storeStock.update({ stock: storeStock.stock + receiveQty }, { transaction: t })

      await StockMovement.create({
        productId:   item.productId,
        storeId:     gr.storeId,
        type:        'receive',
        qty:         receiveQty,
        stockBefore: before,
        stockAfter:  after,
        refType:     'GoodReceive',
        refId:       gr.id,
        refNo:       gr.refNo,
        notes:       item.comments || gr.notes,
      }, { transaction: t })
    }
    await gr.update({ status: 'confirmed' }, { transaction: t })
    await t.commit()
    require('../../audit/audit.service').log({ action: 'gr.confirm', entityType: 'GoodReceive', entityId: id, summary: { refNo: gr.refNo } })
    return getById(id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const remove = async (id) => {
  const gr = await GoodReceive.findByPk(id)
  if (!gr) throw { status: 404, message: 'Good Receive not found' }
  if (gr.status === 'confirmed') throw { status: 400, message: 'Cannot delete a confirmed Good Receive' }
  await gr.destroy()
}

// Edit a draft GR. Header + items both replaced atomically; mirrors create()'s
// recompute step so wac/netAmount/stockQty stay in sync with the new inputs.
const update = async (id, { date, supplier, storeId, notes, docType, invoiceNo, invoiceDate, deliveryNo, invoiceDiscount, invoiceNetAmount, items = [], userId }) => {
  const gr = await GoodReceive.findByPk(id)
  if (!gr) throw { status: 404, message: 'Good Receive not found' }
  if (gr.status === 'confirmed') throw { status: 400, message: 'Cannot edit a confirmed Good Receive' }
  if (!date)    throw { status: 400, message: 'Date is required' }
  if (!storeId) throw { status: 400, message: 'Store is required' }
  if (!items.length) throw { status: 400, message: 'At least one item is required' }

  const type = docType || gr.docType || 'invoice'
  if (type === 'invoice'  && !invoiceNo?.trim())  throw { status: 400, message: 'Invoice Number is required' }
  if (type === 'delivery' && !deliveryNo?.trim()) throw { status: 400, message: 'Delivery Number is required' }

  const store = await Store.findByPk(storeId)
  if (!store) throw { status: 400, message: 'Store not found' }

  const t = await sequelize.transaction()
  try {
    await gr.update({
      date, supplier, storeId, notes,
      docType:          type,
      invoiceNo:        type === 'invoice'  ? (invoiceNo  || null) : null,
      invoiceDate:      type === 'invoice'  ? (invoiceDate || null) : null,
      deliveryNo:       type === 'delivery' ? (deliveryNo  || null) : null,
      invoiceDiscount:  type === 'invoice'  ? (parseFloat(invoiceDiscount)  || 0) : 0,
      invoiceNetAmount: type === 'invoice'  ? (parseFloat(invoiceNetAmount) || 0) : 0,
      modifiedBy: userId || null,
    }, { transaction: t })

    // Replace items wholesale — simpler than diffing, safe because draft items
    // haven't yet posted any stock movements.
    await GoodReceiveItem.destroy({ where: { goodReceiveId: gr.id }, transaction: t })

    for (const item of items) {
      if (!item.productId)              throw { status: 400, message: 'Product is required on all items' }
      if (!item.qty || item.qty <= 0)   throw { status: 400, message: 'Quantity must be greater than 0' }

      const wac       = calcWac(item.qty, item.cost, item.freeQty)
      const netAmount = calcNetAmount(item.qty, item.cost, item.discountPct, item.discount)
      const convertedQty     = await toStockQty(item.qty,     item.qtyUomId)
      const convertedFreeQty = await toStockQty(item.freeQty, item.freeQtyUomId)
      const stockQty         = toFixed(parseFloat(convertedQty) + parseFloat(convertedFreeQty), 4)

      await GoodReceiveItem.create({
        goodReceiveId:  gr.id,
        organizationId: gr.organizationId,
        productId:     item.productId,
        qty:           item.qty,
        qtyUomId:      item.qtyUomId     || null,
        freeQty:       item.freeQty      || 0,
        freeQtyUomId:  item.freeQtyUomId || null,
        batchId:       item.batchId      || null,
        expiryDate:    item.expiryDate   || null,
        cost:          item.cost         || 0,
        discount:      item.discount     || 0,
        discountPct:   item.discountPct  || 0,
        netAmount,
        wac,
        stockQty,
        comments:      item.comments     || null,
      }, { transaction: t })
    }

    await t.commit()
    return getById(id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const createBill = async (id, userId, organizationId) => {
  const gr = await getById(id)
  if (gr.status !== 'confirmed') {
    throw { status: 400, message: 'Only confirmed Good Receives can generate a bill' }
  }
  const { VendorBill, PurchaseOrder } = require('../../../../server/models')
  const existing = await VendorBill.findOne({
    where: { goodReceiveId: gr.id, dataFlag: { [Op.ne]: 2 } },
    attributes: ['id', 'billNumber'],
  })
  if (existing) throw { status: 400, message: `Vendor bill ${existing.billNumber} already exists for this Good Receive. Cancel it first to create a new one.` }

  // Pull vendor from linked PO when available
  let vendorId = null
  if (gr.purchaseOrderId) {
    const po = await PurchaseOrder.findByPk(gr.purchaseOrderId)
    if (po) vendorId = po.vendorId
  }
  const billSvc = require('../../accounting/services/vendor-bill.service')
  const bill = await billSvc.create({
    vendorId,
    purchaseOrderId: gr.purchaseOrderId || null,
    goodReceiveId:   gr.id,
    vendorInvoiceNo: gr.invoiceNo || null,
    billDate:        new Date().toISOString().slice(0, 10),
    notes:           `Auto-created from Good Receive ${gr.refNo}`,
    items: gr.items.map(i => ({
      productId:   i.productId,
      description: i.product?.name || 'Item',
      quantity:    parseFloat(i.qty) || 0,
      unitPrice:   parseFloat(i.cost) || 0,
    })),
    taxRate: 0,
    userId,
    organizationId,
  })
  return { id: bill.id }
}

module.exports = { list, getById, create, update, confirm, remove, createBill }
