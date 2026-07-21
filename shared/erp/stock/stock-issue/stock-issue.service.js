const { StockIssue, StockIssueItem, Product, Store, StoreStock } = require('../../../../server/models')
const { Op } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { getNext } = require('../../settings/services/sequence.service')

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
        {
          stockIssueId: issue.id,
          productId:    item.productId,
          qty:          item.qty,
          batchId:      item.batchId || null,
          expiryDate:   item.expiryDate || null,
          notes:        item.notes || null,
          organizationId: organizationId || null,
        },
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

const update = async (id, { date, storeId, reason, notes, items = [], userId, organizationId }) => {
  const issue = await StockIssue.findByPk(id)
  if (!issue) throw { status: 404, message: 'Stock Issue not found' }
  if (issue.status !== 'draft') throw { status: 400, message: 'Only draft issues can be edited' }
  if (!date)         throw { status: 400, message: 'Date is required' }
  if (!storeId)      throw { status: 400, message: 'Store is required' }
  if (!items.length) throw { status: 400, message: 'At least one item is required' }
  const store = await Store.findByPk(storeId)
  if (!store) throw { status: 400, message: 'Store not found' }

  const t = await sequelize.transaction()
  try {
    await issue.update({ date, storeId, reason, notes, modifiedBy: userId || null }, { transaction: t })
    await StockIssueItem.destroy({ where: { stockIssueId: id }, transaction: t })
    for (const item of items) {
      if (!item.productId) throw { status: 400, message: 'Product is required on all items' }
      if (!item.qty || item.qty <= 0) throw { status: 400, message: 'Quantity must be greater than 0' }
      await StockIssueItem.create(
        {
          stockIssueId: id,
          productId:    item.productId,
          qty:          item.qty,
          batchId:      item.batchId || null,
          expiryDate:   item.expiryDate || null,
          notes:        item.notes || null,
          organizationId: organizationId || null,
        },
        { transaction: t }
      )
    }
    await t.commit()
    return getById(id)
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

  const stockLedger = require('../stock-ledger/stock-ledger.service')
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

      await stockLedger.postDelta({
        productId: item.productId,
        storeId: issue.storeId,
        qty: -parseFloat(item.qty),
        type: 'issue',
        refType: 'StockIssue',
        refId: issue.id,
        refNo: issue.refNo,
        notes: item.notes || issue.notes,
        organizationId: issue.organizationId ?? null,
        transaction: t,
      })
    }

    await issue.update({ status: 'confirmed' }, { transaction: t })
    await t.commit()
    // Relieve inventory at standard cost in the GL (outside the txn). Idempotent.
    await require('../../accounting/services/auto-journal.service').postStockIssue({
      id: issue.id, refNo: issue.refNo, date: issue.date,
      items: issue.items.map(i => ({ productId: i.productId, qty: i.qty })),
      organizationId: issue.organizationId,
    })
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

module.exports = { list, getById, create, update, confirm, remove }
