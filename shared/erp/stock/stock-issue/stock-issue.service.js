const { StockIssue, StockIssueItem, Product, Store, StoreStock, StockMovement } = require('../../../../server/models')
const { Op } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { getNext } = require('../../settings/sequence.service')

const productAttrs = ['id', 'name', 'sku', 'stock', 'unit']

const itemInclude = {
  model: StockIssueItem,
  as: 'items',
  include: [{ model: Product, as: 'product', attributes: productAttrs }],
}

const storeInclude = { model: Store, as: 'store', attributes: ['id', 'name', 'code'] }

const nextRefNo = (userId) => getNext('ISS', userId)

const list = async ({ page = 1, limit = 20, search = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where = search
    ? { [Op.or]: [{ refNo: { [Op.like]: `%${search}%` } }, { reason: { [Op.like]: `%${search}%` } }], organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
    : { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  const { count, rows } = await StockIssue.findAndCountAll({
    where, limit, offset,
    order: [['createdAt', 'DESC']],
    include: [storeInclude],
    distinct: true,
  })
  return { total: count, page, limit, issues: rows }
}

const getById = async (id) => {
  const issue = await StockIssue.findByPk(id, { include: [itemInclude, storeInclude] })
  if (!issue) throw { status: 404, message: 'Stock Issue not found' }
  return issue
}

const create = async ({ date, storeId, reason, notes, items = [], userId, organizationId }) => {
  if (!date)    throw { status: 400, message: 'Date is required' }
  if (!storeId) throw { status: 400, message: 'Store is required' }
  if (!items.length) throw { status: 400, message: 'At least one item is required' }

  const store = await Store.findByPk(storeId)
  if (!store) throw { status: 400, message: 'Store not found' }

  const refNo = await nextRefNo(userId)
  const t = await sequelize.transaction()
  try {
    const issue = await StockIssue.create({ refNo, date, storeId, reason, notes, organizationId: organizationId || null, createdBy: userId || null, modifiedBy: userId || null }, { transaction: t })
    for (const item of items) {
      if (!item.productId) throw { status: 400, message: 'Product is required on all items' }
      if (!item.qty || item.qty <= 0) throw { status: 400, message: 'Quantity must be greater than 0' }
      await StockIssueItem.create(
        { stockIssueId: issue.id, productId: item.productId, qty: item.qty, notes: item.notes || null, organizationId: organizationId || null },
        { transaction: t }
      )
    }
    await t.commit()
    return getById(issue.id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const confirm = async (id) => {
  const issue = await StockIssue.findByPk(id, { include: [itemInclude] })
  if (!issue) throw { status: 404, message: 'Stock Issue not found' }
  if (issue.status === 'confirmed') throw { status: 400, message: 'Already confirmed' }
  if (!issue.storeId) throw { status: 400, message: 'Store is required before confirming' }
  const { checkStoreLock } = require('../stock-count/stock-count.service')
  await checkStoreLock(issue.storeId)

  const t = await sequelize.transaction()
  try {
    for (const item of issue.items) {
      const product = await Product.findByPk(item.productId, { transaction: t })

      const [storeStock] = await StoreStock.findOrCreate({
        where: { productId: item.productId, storeId: issue.storeId },
        defaults: { stock: 0 },
        transaction: t,
      })

      if (storeStock.stock < item.qty) {
        throw {
          status: 400,
          message: `Insufficient stock for "${product.name}" (available: ${storeStock.stock}, requested: ${item.qty})`,
        }
      }

      const before = parseFloat(product.stock)
      const after  = before - parseFloat(item.qty)

      await product.update({ stock: after }, { transaction: t })
      await storeStock.update({ stock: storeStock.stock - parseFloat(item.qty) }, { transaction: t })

      await StockMovement.create({
        productId:   item.productId,
        storeId:     issue.storeId,
        type:        'issue',
        qty:         -parseFloat(item.qty),
        stockBefore: before,
        stockAfter:  after,
        refType:     'StockIssue',
        refId:       issue.id,
        refNo:       issue.refNo,
        notes:       item.notes || issue.notes,
      }, { transaction: t })
    }

    await issue.update({ status: 'confirmed' }, { transaction: t })
    await t.commit()
    return getById(id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const remove = async (id) => {
  const issue = await StockIssue.findByPk(id)
  if (!issue) throw { status: 404, message: 'Stock Issue not found' }
  if (issue.status === 'confirmed') throw { status: 400, message: 'Cannot delete a confirmed Stock Issue' }
  await issue.destroy()
}

module.exports = { list, getById, create, confirm, remove }
