const { GoodReceive, GoodReceiveItem, Product, Store, StoreStock, StockMovement, UOM } = require('../../server/models')
const { Op } = require('sequelize')
const sequelize = require('../../server/config/database')
const { toFixed } = require('../../server/utils/fmt')

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

async function nextRefNo() {
  const count = await GoodReceive.count()
  return `GR-${String(count + 1).padStart(4, '0')}`
}

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

const list = async ({ page = 1, limit = 20, search = '' }) => {
  const offset = (page - 1) * limit
  const where = search
    ? { [Op.or]: [{ refNo: { [Op.like]: `%${search}%` } }, { supplier: { [Op.like]: `%${search}%` } }] }
    : {}
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
  return gr
}

const create = async ({ date, supplier, storeId, notes, docType = 'invoice', invoiceNo, invoiceDate, deliveryNo, invoiceDiscount, invoiceNetAmount, items = [] }) => {
  if (!date) throw { status: 400, message: 'Date is required' }
  if (!storeId) throw { status: 400, message: 'Store is required' }
  if (!items.length) throw { status: 400, message: 'At least one item is required' }

  if (docType === 'invoice' && !invoiceNo?.trim())
    throw { status: 400, message: 'Invoice Number is required' }
  if (docType === 'delivery' && !deliveryNo?.trim())
    throw { status: 400, message: 'Delivery Number is required' }

  const store = await Store.findByPk(storeId)
  if (!store) throw { status: 400, message: 'Store not found' }
  const refNo = await nextRefNo()
  const t = await sequelize.transaction()
  try {
    const gr = await GoodReceive.create({
      refNo, date, supplier, storeId, notes,
      docType:          docType || 'invoice',
      invoiceNo:        docType === 'invoice'  ? (invoiceNo  || null) : null,
      invoiceDate:      docType === 'invoice'  ? (invoiceDate || null) : null,
      deliveryNo:       docType === 'delivery' ? (deliveryNo  || null) : null,
      invoiceDiscount:  docType === 'invoice'  ? (parseFloat(invoiceDiscount)  || 0) : 0,
      invoiceNetAmount: docType === 'invoice'  ? (parseFloat(invoiceNetAmount) || 0) : 0,
    }, { transaction: t })
    for (const item of items) {
      if (!item.productId) throw { status: 400, message: 'Product is required on all items' }
      if (!item.qty || item.qty <= 0) throw { status: 400, message: 'Quantity must be greater than 0' }

      const wac       = calcWac(item.qty, item.cost, item.freeQty)
      const netAmount = calcNetAmount(item.qty, item.cost, item.discountPct, item.discount)

      await GoodReceiveItem.create({
        goodReceiveId: gr.id,
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
  const t = await sequelize.transaction()
  try {
    for (const item of gr.items) {
      const receiveQty = parseFloat(item.qty) + parseFloat(item.freeQty || 0)
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

module.exports = { list, getById, create, confirm, remove }
