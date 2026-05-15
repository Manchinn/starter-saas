const { StockReturn, StockReturnItem, Product, Store, StoreStock, StockMovement, Customer, Vendor } = require('../../../../server/models')
const { Op } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { getNext } = require('../../settings/sequence.service')

const productAttrs = ['id', 'name', 'sku', 'stock']

const itemInclude = {
  model: StockReturnItem,
  as: 'items',
  include: [{ model: Product, as: 'product', attributes: productAttrs }],
}

const headerIncludes = [
  { model: Store,    as: 'store',    attributes: ['id', 'name', 'code'] },
  { model: Customer, as: 'customer', attributes: ['id', 'name', 'company'] },
  { model: Vendor,   as: 'vendor',   attributes: ['id', 'name', 'code'] },
]

const nextRefNo = (userId) => getNext('RTN', userId)

const list = async ({ page = 1, limit = 20, search = '', type = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (search) where[Op.or] = [
    { refNo: { [Op.like]: `%${search}%` } },
  ]
  if (type) where.type = type

  const { count, rows } = await StockReturn.findAndCountAll({
    where, limit, offset,
    order: [['createdAt', 'DESC']],
    include: headerIncludes,
    distinct: true,
  })
  return { total: count, page, limit, returns: rows }
}

const getById = async (id) => {
  const sr = await StockReturn.findByPk(id, { include: [itemInclude, ...headerIncludes] })
  if (!sr) throw { status: 404, message: 'Stock Return not found' }
  return sr
}

const create = async ({ date, type, storeId, customerId, vendorId, notes, items = [], userId, organizationId }) => {
  if (!date)    throw { status: 400, message: 'Date is required' }
  if (!type || !['customer_return', 'vendor_return'].includes(type))
    throw { status: 400, message: 'Type must be customer_return or vendor_return' }
  if (!storeId) throw { status: 400, message: 'Store is required' }
  if (!items.length) throw { status: 400, message: 'At least one item is required' }

  if (type === 'customer_return' && customerId) {
    const c = await Customer.findByPk(customerId)
    if (!c) throw { status: 400, message: 'Customer not found' }
  }
  if (type === 'vendor_return' && vendorId) {
    const v = await Vendor.findByPk(vendorId)
    if (!v) throw { status: 400, message: 'Vendor not found' }
  }

  const store = await Store.findByPk(storeId)
  if (!store) throw { status: 400, message: 'Store not found' }

  const refNo = await nextRefNo(userId)
  const t = await sequelize.transaction()
  try {
    const sr = await StockReturn.create({
      refNo, date, type, storeId, notes,
      customerId: type === 'customer_return' ? (customerId || null) : null,
      vendorId:   type === 'vendor_return'   ? (vendorId   || null) : null,
      organizationId: organizationId || null,
      createdBy: userId || null, modifiedBy: userId || null,
    }, { transaction: t })

    for (const item of items) {
      if (!item.productId) throw { status: 400, message: 'Product is required on all items' }
      if (!item.qty || parseFloat(item.qty) <= 0) throw { status: 400, message: 'Quantity must be greater than 0' }
      await StockReturnItem.create({
        stockReturnId: sr.id,
        productId:  item.productId,
        qty:        parseFloat(item.qty),
        cost:       parseFloat(item.cost || 0),
        batchId:    item.batchId || null,
        expiryDate: item.expiryDate || null,
        reason:     item.reason || null,
        organizationId: organizationId || null,
      }, { transaction: t })
    }

    await t.commit()
    return getById(sr.id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const confirm = async (id) => {
  const sr = await StockReturn.findByPk(id, { include: [itemInclude] })
  if (!sr) throw { status: 404, message: 'Stock Return not found' }
  if (sr.status === 'confirmed') throw { status: 400, message: 'Already confirmed' }

  // customer_return → stock IN (+qty)
  // vendor_return   → stock OUT (−qty)
  const delta = sr.type === 'customer_return' ? 1 : -1
  const movementType = sr.type === 'customer_return' ? 'customer_return' : 'vendor_return'

  const { checkStoreLock } = require('../stock-count/stock-count.service')
  if (sr.storeId) await checkStoreLock(sr.storeId)

  const t = await sequelize.transaction()
  try {
    for (const item of sr.items) {
      const qty = parseFloat(item.qty)
      const product = await Product.findByPk(item.productId, { transaction: t })
      const before = parseFloat(product.stock)
      const after  = before + delta * qty

      await product.update({ stock: after }, { transaction: t })

      const [storeStock] = await StoreStock.findOrCreate({
        where: { productId: item.productId, storeId: sr.storeId },
        defaults: { stock: 0 },
        transaction: t,
      })
      await storeStock.update({ stock: parseFloat(storeStock.stock) + delta * qty }, { transaction: t })

      await StockMovement.create({
        productId:   item.productId,
        storeId:     sr.storeId,
        type:        movementType,
        qty:         delta * qty,
        stockBefore: before,
        stockAfter:  after,
        refType:     'StockReturn',
        refId:       sr.id,
        refNo:       sr.refNo,
        notes:       item.reason || sr.notes,
      }, { transaction: t })
    }

    await sr.update({ status: 'confirmed' }, { transaction: t })
    await t.commit()
    return getById(id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const remove = async (id) => {
  const sr = await StockReturn.findByPk(id)
  if (!sr) throw { status: 404, message: 'Stock Return not found' }
  if (sr.status === 'confirmed') throw { status: 400, message: 'Cannot delete a confirmed Stock Return' }
  await sr.destroy()
}

module.exports = { list, getById, create, confirm, remove }
