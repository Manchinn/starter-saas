const { StockMovement, Product, Store } = require('../../server/models')

const list = async ({ page = 1, limit = 20, productId = '', storeId = '', type = '' }) => {
  const offset = (page - 1) * limit
  const where = {}
  if (productId) where.productId = productId
  if (storeId)   where.storeId   = storeId
  if (type)      where.type      = type
  const { count, rows } = await StockMovement.findAndCountAll({
    where, limit, offset,
    order: [['createdAt', 'DESC']],
    include: [
      { model: Product, as: 'product', attributes: ['id', 'name', 'sku'] },
      { model: Store,   as: 'store',   attributes: ['id', 'name', 'code'] },
    ],
    distinct: true,
  })
  return { total: count, page, limit, movements: rows }
}

module.exports = { list }
