const { StockCount, StockCountItem, Product, Store, StoreStock, StockMovement } = require('../../../../server/models')
const { Op, fn, col } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { getNext } = require('../../settings/services/sequence.service')

const productAttrs = ['id', 'name', 'sku', 'stock']

const itemInclude = {
  model: StockCountItem,
  as: 'items',
  include: [{ model: Product, as: 'product', attributes: productAttrs }],
}

const storeInclude = { model: Store, as: 'store', attributes: ['id', 'name', 'code'] }

const nextRefNo = (userId) => getNext('CNT', userId)

const list = async ({ page = 1, limit = 20, search = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where = search
    ? { [Op.or]: [{ refNo: { [Op.like]: `%${search}%` } }], organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
    : { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  const { count, rows } = await StockCount.findAndCountAll({
    where, limit, offset,
    order: [['createdAt', 'DESC']],
    include: [storeInclude],
    distinct: true,
  })
  return { total: count, page, limit, counts: rows }
}

const getById = async (id) => {
  const sc = await StockCount.findByPk(id, { include: [itemInclude, storeInclude] })
  if (!sc) throw { status: 404, message: 'Stock Count not found' }
  return sc
}

// Return all products for a store with their current store stock
const getStoreProducts = async (storeId) => {
  const store = await Store.findByPk(storeId)
  if (!store) throw { status: 404, message: 'Store not found' }

  const storeStocks = await StoreStock.findAll({
    where: { storeId },
    include: [{ model: Product, as: 'product', attributes: productAttrs, where: { status: 'active' } }],
    order: [[{ model: Product, as: 'product' }, 'name', 'ASC']],
  })

  return storeStocks.map((ss) => ({
    productId: ss.productId,
    name: ss.product.name,
    sku: ss.product.sku,
    systemQty: parseFloat(ss.stock),
  }))
}

/**
 * Throws a 409 (Conflict) when *any* of the supplied stores currently has an
 * in-progress stock count holding the movement lock. The error includes the
 * lock owner's refNo / date / store-name so the caller can render an
 * actionable message instead of a generic "store is locked".
 *
 * Accepts either a single storeId or an array — callers like stock-request
 * (with from + to stores) and sales-order confirm (with N item stores) pass
 * arrays so we only run one query.
 */
const checkStoreLock = async (storeIdOrIds) => {
  const storeIds = Array.isArray(storeIdOrIds) ? storeIdOrIds.filter(Boolean) : (storeIdOrIds ? [storeIdOrIds] : [])
  if (!storeIds.length) return

  const lockedCount = await StockCount.findOne({
    where: { storeId: { [Op.in]: storeIds }, status: 'draft', movementLocked: true },
    include: [storeInclude],
    attributes: ['id', 'refNo', 'date', 'storeId', 'updatedAt'],
  })
  if (!lockedCount) return

  const storeName = lockedCount.store?.name || 'this store'
  throw {
    status: 409,
    code:   'STORE_STOCK_LOCKED',
    message: `${storeName} is locked for stock count ${lockedCount.refNo} (started ${lockedCount.date}). Confirm or unlock the count first.`,
    lock: {
      stockCountId: lockedCount.id,
      refNo:        lockedCount.refNo,
      date:         lockedCount.date,
      storeId:      lockedCount.storeId,
      storeName,
    },
  }
}

const create = async ({ date, storeId, notes, items = [], movementLocked = false, userId, organizationId }) => {
  if (!date) throw { status: 400, message: 'Date is required' }
  if (!storeId) throw { status: 400, message: 'Store is required' }
  if (!items.length) throw { status: 400, message: 'At least one item is required' }
  const store = await Store.findByPk(storeId)
  if (!store) throw { status: 400, message: 'Store not found' }

  const refNo = await nextRefNo(userId)
  const t = await sequelize.transaction()
  try {
    const sc = await StockCount.create({ refNo, date, storeId, notes, movementLocked, organizationId: organizationId || null, createdBy: userId || null, modifiedBy: userId || null }, { transaction: t })
    for (const item of items) {
      if (!item.productId) throw { status: 400, message: 'Product is required on all items' }
      await StockCountItem.create({
        stockCountId: sc.id,
        productId: item.productId,
        systemQty: item.systemQty ?? 0,
        countedQty: item.countedQty ?? 0,
        organizationId: organizationId || null,
      }, { transaction: t })
    }
    await t.commit()
    return getById(sc.id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const update = async (id, { date, storeId, notes, items = [], movementLocked }) => {
  const sc = await StockCount.findByPk(id)
  if (!sc) throw { status: 404, message: 'Stock Count not found' }
  if (sc.status === 'confirmed') throw { status: 400, message: 'Cannot update a confirmed stock count' }

  const t = await sequelize.transaction()
  try {
    await sc.update({ date, storeId, notes, movementLocked }, { transaction: t })
    if (items.length) {
      await StockCountItem.destroy({ where: { stockCountId: id }, transaction: t })
      for (const item of items) {
        await StockCountItem.create({
          stockCountId: id,
          productId: item.productId,
          systemQty: item.systemQty ?? 0,
          countedQty: item.countedQty ?? 0,
        }, { transaction: t })
      }
    }
    await t.commit()
    return getById(id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const confirm = async (id, userId) => {
  const sc = await StockCount.findByPk(id, { include: [itemInclude] })
  if (!sc) throw { status: 404, message: 'Stock Count not found' }
  if (sc.status === 'confirmed') throw { status: 400, message: 'Already confirmed' }

  const t = await sequelize.transaction()
  try {
    for (const item of sc.items) {
      const variance = parseFloat(item.countedQty) - parseFloat(item.systemQty)
      if (variance === 0) continue // no change needed

      // Set store stock to counted qty (absolute set)
      const [storeStock] = await StoreStock.findOrCreate({
        where: { productId: item.productId, storeId: sc.storeId },
        defaults: { stock: 0 },
        transaction: t,
      })
      const stockBefore = parseFloat(storeStock.stock)
      await storeStock.update({ stock: item.countedQty }, { transaction: t })

      // Recalculate product total stock across all stores
      const totalStoreStock = await StoreStock.sum('stock', {
        where: { productId: item.productId },
        transaction: t,
      })
      const product = await Product.findByPk(item.productId, { transaction: t })
      await product.update({ stock: totalStoreStock || 0 }, { transaction: t })

      // Record movement
      await StockMovement.create({
        productId: item.productId,
        storeId: sc.storeId,
        type: 'count',
        qty: variance,
        stockBefore,
        stockAfter: parseFloat(item.countedQty),
        refType: 'StockCount',
        refId: sc.id,
        refNo: sc.refNo,
        notes: `Stock count: system ${item.systemQty} → counted ${item.countedQty}`,
      }, { transaction: t })
    }

    // Unlocking on confirm
    await sc.update({ status: 'confirmed', movementLocked: false, modifiedBy: userId || null }, { transaction: t })
    await t.commit()

    require('../../audit/audit.service').log({
      userId, action: 'stock-count.confirmed',
      entityType: 'StockCount', entityId: sc.id,
      summary: { refNo: sc.refNo, storeId: sc.storeId, itemCount: sc.items.length },
    })

    return getById(id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

/**
 * Toggle the movement lock on a draft stock count. Used by the explicit
 * /lock and /unlock endpoints so callers don't have to round-trip the
 * whole form payload through PUT just to flip one boolean.
 */
const setLock = async (id, locked, userId) => {
  const sc = await StockCount.findByPk(id)
  if (!sc) throw { status: 404, message: 'Stock Count not found' }
  if (sc.status !== 'draft') throw { status: 400, message: 'Only draft stock counts can change their lock state' }
  if (sc.movementLocked === locked) return getById(id)

  await sc.update({ movementLocked: locked, modifiedBy: userId || null })

  require('../../audit/audit.service').log({
    userId,
    action: locked ? 'stock-count.locked' : 'stock-count.unlocked',
    entityType: 'StockCount',
    entityId: sc.id,
    summary: { refNo: sc.refNo, storeId: sc.storeId },
  })

  return getById(id)
}

const remove = async (id) => {
  const sc = await StockCount.findByPk(id)
  if (!sc) throw { status: 404, message: 'Stock Count not found' }
  if (sc.status === 'confirmed') throw { status: 400, message: 'Cannot delete a confirmed stock count' }
  await sc.destroy()
}

module.exports = { list, getById, getStoreProducts, create, update, confirm, remove, checkStoreLock, setLock }

