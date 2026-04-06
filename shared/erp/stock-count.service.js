const { StockCount, StockCountItem, Product, Store, StoreStock, StockMovement } = require('../../server/models')
const { Op, fn, col } = require('sequelize')
const sequelize = require('../../server/config/database')

const productAttrs = ['id', 'name', 'sku', 'stock']

const itemInclude = {
  model: StockCountItem,
  as: 'items',
  include: [{ model: Product, as: 'product', attributes: productAttrs }],
}

const storeInclude = { model: Store, as: 'store', attributes: ['id', 'name', 'code'] }

async function nextRefNo() {
  const count = await StockCount.count()
  return `CNT-${String(count + 1).padStart(4, '0')}`
}

const list = async ({ page = 1, limit = 20, search = '' }) => {
  const offset = (page - 1) * limit
  const where = search
    ? { [Op.or]: [{ refNo: { [Op.like]: `%${search}%` } }] }
    : {}
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

const create = async ({ date, storeId, notes, items = [] }) => {
  if (!date) throw { status: 400, message: 'Date is required' }
  if (!storeId) throw { status: 400, message: 'Store is required' }
  if (!items.length) throw { status: 400, message: 'At least one item is required' }
  const store = await Store.findByPk(storeId)
  if (!store) throw { status: 400, message: 'Store not found' }

  const refNo = await nextRefNo()
  const t = await sequelize.transaction()
  try {
    const sc = await StockCount.create({ refNo, date, storeId, notes }, { transaction: t })
    for (const item of items) {
      if (!item.productId) throw { status: 400, message: 'Product is required on all items' }
      await StockCountItem.create({
        stockCountId: sc.id,
        productId: item.productId,
        systemQty: item.systemQty ?? 0,
        countedQty: item.countedQty ?? 0,
      }, { transaction: t })
    }
    await t.commit()
    return getById(sc.id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const confirm = async (id) => {
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

    await sc.update({ status: 'confirmed' }, { transaction: t })
    await t.commit()
    return getById(id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const remove = async (id) => {
  const sc = await StockCount.findByPk(id)
  if (!sc) throw { status: 404, message: 'Stock Count not found' }
  if (sc.status === 'confirmed') throw { status: 400, message: 'Cannot delete a confirmed stock count' }
  await sc.destroy()
}

module.exports = { list, getById, getStoreProducts, create, confirm, remove }
