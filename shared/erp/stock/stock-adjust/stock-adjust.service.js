const { StockAdjust, StockAdjustItem, Product, Store, StoreStock, StockMovement } = require('../../../../server/models')
const { Op } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { getNext } = require('../../settings/services/sequence.service')

const productAttrs = ['id', 'name', 'sku', 'stock', 'unit']

const itemInclude = {
  model: StockAdjustItem,
  as: 'items',
  include: [{ model: Product, as: 'product', attributes: productAttrs }],
}

const storeInclude = { model: Store, as: 'store', attributes: ['id', 'name', 'code'] }

const nextRefNo = (userId) => getNext('ADJ', userId)

const list = async ({ page = 1, limit = 20, search = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where = search
    ? { [Op.or]: [{ refNo: { [Op.like]: `%${search}%` } }, { reason: { [Op.like]: `%${search}%` } }], organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
    : { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  const { count, rows } = await StockAdjust.findAndCountAll({
    where, limit, offset,
    order: [['createdAt', 'DESC']],
    include: [storeInclude],
    distinct: true,
  })
  return { total: count, page, limit, adjustments: rows }
}

const getById = async (id) => {
  const adj = await StockAdjust.findByPk(id, { include: [itemInclude, storeInclude] })
  if (!adj) throw { status: 404, message: 'Stock Adjustment not found' }
  return adj
}

const create = async ({ date, reason, storeId, notes, items = [], userId, organizationId }) => {
  if (!date) throw { status: 400, message: 'Date is required' }
  if (!storeId) throw { status: 400, message: 'Store is required' }
  if (!items.length) throw { status: 400, message: 'At least one item is required' }
  const store = await Store.findByPk(storeId)
  if (!store) throw { status: 400, message: 'Store not found' }
  const refNo = await nextRefNo(userId)
  const t = await sequelize.transaction()
  try {
    const adj = await StockAdjust.create({ refNo, date, reason, storeId, notes, organizationId: organizationId || null, createdBy: userId || null, modifiedBy: userId || null }, { transaction: t })
    for (const item of items) {
      if (!item.productId) throw { status: 400, message: 'Product is required on all items' }
      if (item.qty === undefined || item.qty === 0) throw { status: 400, message: 'Quantity cannot be zero' }
      await StockAdjustItem.create(
        { stockAdjustId: adj.id, productId: item.productId, qty: item.qty, notes: item.notes || null, organizationId: organizationId || null },
        { transaction: t }
      )
    }
    await t.commit()
    require('../../audit/audit.service').log({
      userId, action: 'stock-adjust.created', entityType: 'StockAdjust', entityId: adj.id,
      summary: { refNo: adj.refNo, storeId, items: items.length },
    })
    return getById(adj.id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const update = async (id, { date, reason, storeId, notes, items = [], userId, organizationId }) => {
  const adj = await StockAdjust.findByPk(id)
  if (!adj) throw { status: 404, message: 'Stock Adjustment not found' }
  if (adj.status !== 'draft') throw { status: 400, message: 'Only draft adjustments can be edited' }
  if (!date)          throw { status: 400, message: 'Date is required' }
  if (!storeId)       throw { status: 400, message: 'Store is required' }
  if (!items.length)  throw { status: 400, message: 'At least one item is required' }
  const store = await Store.findByPk(storeId)
  if (!store) throw { status: 400, message: 'Store not found' }

  const t = await sequelize.transaction()
  try {
    await adj.update({ date, reason, storeId, notes, modifiedBy: userId || null }, { transaction: t })
    await StockAdjustItem.destroy({ where: { stockAdjustId: id }, transaction: t })
    for (const item of items) {
      if (!item.productId) throw { status: 400, message: 'Product is required on all items' }
      if (item.qty === undefined || item.qty === 0) throw { status: 400, message: 'Quantity cannot be zero' }
      await StockAdjustItem.create(
        { stockAdjustId: id, productId: item.productId, qty: item.qty, notes: item.notes || null, organizationId: organizationId || null },
        { transaction: t }
      )
    }
    await t.commit()
    require('../../audit/audit.service').log({
      userId, action: 'stock-adjust.updated', entityType: 'StockAdjust', entityId: id,
      summary: { refNo: adj.refNo, items: items.length },
    })
    return getById(id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const confirm = async (id) => {
  const adj = await StockAdjust.findByPk(id, { include: [itemInclude] })
  if (!adj) throw { status: 404, message: 'Stock Adjustment not found' }
  if (adj.status === 'confirmed') throw { status: 400, message: 'Already confirmed' }
  if (!adj.storeId) throw { status: 400, message: 'Store is required before confirming' }
  const { checkStoreLock } = require('../stock-count/stock-count.service')
  await checkStoreLock(adj.storeId)

  const t = await sequelize.transaction()
  try {
    for (const item of adj.items) {
      const product = await Product.findByPk(item.productId, { transaction: t })
      const before = product.stock
      const after = before + item.qty

      // Update total product stock
      await product.update({ stock: after }, { transaction: t })

      // Update per-store stock
      const [storeStock] = await StoreStock.findOrCreate({
        where: { productId: item.productId, storeId: adj.storeId },
        defaults: { stock: 0 },
        transaction: t,
      })
      await storeStock.update({ stock: storeStock.stock + item.qty }, { transaction: t })

      await StockMovement.create({
        productId: item.productId,
        storeId: adj.storeId,
        type: 'adjust',
        qty: item.qty,
        stockBefore: before,
        stockAfter: after,
        refType: 'StockAdjust',
        refId: adj.id,
        refNo: adj.refNo,
        notes: item.notes || adj.notes,
      }, { transaction: t })
    }
    await adj.update({ status: 'confirmed' }, { transaction: t })
    await t.commit()
    // Post the inventory true-up to the GL (outside the txn — postJournal opens
    // its own). Idempotent on sourceType 'StockAdjust'.
    await require('../../accounting/services/auto-journal.service').postStockAdjustment({
      id: adj.id, refNo: adj.refNo, date: adj.date,
      items: adj.items.map(i => ({ productId: i.productId, qty: i.qty })),
      organizationId: adj.organizationId,
    })
    require('../../audit/audit.service').log({
      action: 'stock-adjust.confirmed', entityType: 'StockAdjust', entityId: id,
      summary: { refNo: adj.refNo, storeId: adj.storeId, items: adj.items.length },
    })
    return getById(id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const remove = async (id, userId) => {
  const adj = await StockAdjust.findByPk(id)
  if (!adj) throw { status: 404, message: 'Stock Adjustment not found' }
  if (adj.status === 'confirmed') throw { status: 400, message: 'Cannot delete a confirmed adjustment' }
  await adj.destroy()
  require('../../audit/audit.service').log({
    userId, action: 'stock-adjust.deleted', entityType: 'StockAdjust', entityId: id,
    summary: { refNo: adj.refNo },
  })
}

module.exports = { list, getById, create, update, confirm, remove }
