const { StockRequest, StockRequestItem, Product, Store, StoreStock, StockMovement } = require('../../server/models')
const { Op } = require('sequelize')
const sequelize = require('../../server/config/database')

const productAttrs = ['id', 'name', 'sku', 'stock']
const storeAttrs   = ['id', 'name', 'code']

const itemInclude = {
  model: StockRequestItem,
  as: 'items',
  include: [{ model: Product, as: 'product', attributes: productAttrs }],
}
const storeIncludes = [
  { model: Store, as: 'fromStore', attributes: storeAttrs },
  { model: Store, as: 'toStore',   attributes: storeAttrs },
]

async function nextRefNo() {
  const count = await StockRequest.count()
  return `STR-${String(count + 1).padStart(4, '0')}`
}

const list = async ({ page = 1, limit = 20, search = '' }) => {
  const offset = (page - 1) * limit
  const where = search
    ? { [Op.or]: [{ refNo: { [Op.like]: `%${search}%` } }, { notes: { [Op.like]: `%${search}%` } }] }
    : {}
  const { count, rows } = await StockRequest.findAndCountAll({
    where, limit, offset,
    order: [['createdAt', 'DESC']],
    include: storeIncludes,
    distinct: true,
  })
  return { total: count, page, limit, requests: rows }
}

const getById = async (id) => {
  const req = await StockRequest.findByPk(id, { include: [...storeIncludes, itemInclude] })
  if (!req) throw { status: 404, message: 'Stock Request not found' }
  return req
}

const create = async ({ date, fromStoreId, toStoreId, notes, items = [] }) => {
  if (!date)        throw { status: 400, message: 'Date is required' }
  if (!fromStoreId) throw { status: 400, message: 'Source store is required' }
  if (!toStoreId)   throw { status: 400, message: 'Destination store is required' }
  if (fromStoreId === toStoreId) throw { status: 400, message: 'Source and destination stores must be different' }
  if (!items.length) throw { status: 400, message: 'At least one item is required' }

  const [fromStore, toStore] = await Promise.all([Store.findByPk(fromStoreId), Store.findByPk(toStoreId)])
  if (!fromStore) throw { status: 400, message: 'Source store not found' }
  if (!toStore)   throw { status: 400, message: 'Destination store not found' }

  const refNo = await nextRefNo()
  const t = await sequelize.transaction()
  try {
    const req = await StockRequest.create({ refNo, date, fromStoreId, toStoreId, notes }, { transaction: t })
    for (const item of items) {
      if (!item.productId) throw { status: 400, message: 'Product is required on all items' }
      if (!item.qty || item.qty <= 0) throw { status: 400, message: 'Quantity must be greater than 0' }
      await StockRequestItem.create(
        { stockRequestId: req.id, productId: item.productId, qty: item.qty, notes: item.notes || null },
        { transaction: t }
      )
    }
    await t.commit()
    return getById(req.id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const confirm = async (id) => {
  const req = await StockRequest.findByPk(id, { include: [itemInclude] })
  if (!req) throw { status: 404, message: 'Stock Request not found' }
  if (req.status === 'confirmed') throw { status: 400, message: 'Already confirmed' }

  const t = await sequelize.transaction()
  try {
    for (const item of req.items) {
      const product = await Product.findByPk(item.productId, { transaction: t })

      // Source store: deduct stock
      const [fromStock] = await StoreStock.findOrCreate({
        where: { productId: item.productId, storeId: req.fromStoreId },
        defaults: { stock: 0 },
        transaction: t,
      })
      const fromBefore = fromStock.stock
      if (fromBefore < item.qty) {
        throw { status: 400, message: `Insufficient stock for "${product.name}" at source store (available: ${fromBefore}, requested: ${item.qty})` }
      }
      await fromStock.update({ stock: fromBefore - item.qty }, { transaction: t })

      // Destination store: add stock
      const [toStock] = await StoreStock.findOrCreate({
        where: { productId: item.productId, storeId: req.toStoreId },
        defaults: { stock: 0 },
        transaction: t,
      })
      await toStock.update({ stock: toStock.stock + item.qty }, { transaction: t })

      // StockMovement: transfer_out from source
      await StockMovement.create({
        productId: item.productId,
        storeId: req.fromStoreId,
        type: 'transfer_out',
        qty: -item.qty,
        stockBefore: fromBefore,
        stockAfter: fromBefore - item.qty,
        refType: 'StockRequest',
        refId: req.id,
        refNo: req.refNo,
        notes: item.notes || req.notes,
      }, { transaction: t })

      // StockMovement: transfer_in to destination
      await StockMovement.create({
        productId: item.productId,
        storeId: req.toStoreId,
        type: 'transfer_in',
        qty: item.qty,
        stockBefore: toStock.stock,
        stockAfter: toStock.stock + item.qty,
        refType: 'StockRequest',
        refId: req.id,
        refNo: req.refNo,
        notes: item.notes || req.notes,
      }, { transaction: t })

      // Product total stock unchanged (transfer only)
    }
    await req.update({ status: 'confirmed' }, { transaction: t })
    await t.commit()
    return getById(id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const remove = async (id) => {
  const req = await StockRequest.findByPk(id)
  if (!req) throw { status: 404, message: 'Stock Request not found' }
  if (req.status === 'confirmed') throw { status: 400, message: 'Cannot delete a confirmed Stock Request' }
  await req.destroy()
}

module.exports = { list, getById, create, confirm, remove }
