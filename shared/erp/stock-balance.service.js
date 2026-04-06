const { StoreStock, Product, Store, UOM, StockMovement } = require('../../server/models')
const { Op } = require('sequelize')
const { toFixed } = require('../../server/utils/fmt')

const list = async ({ storeId = '', productId = '', includeZero = false }) => {
  const where = {}
  if (storeId)   where.storeId   = storeId
  if (productId) where.productId = productId
  if (!includeZero) where.stock  = { [Op.gt]: 0 }

  const rows = await StoreStock.findAll({
    where,
    order: [
      [{ model: Store, as: 'store' }, 'name', 'ASC'],
      [{ model: Product, as: 'product' }, 'name', 'ASC'],
    ],
    include: [
      { model: Store, as: 'store', attributes: ['id', 'name', 'code'] },
      {
        model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'cost'],
        include: [
          { model: UOM, as: 'sellingUom', attributes: ['id', 'name', 'abbreviation'] },
        ],
      },
    ],
  })

  return rows.map(r => {
    const qty   = parseFloat(r.stock)
    const wac   = parseFloat(r.product?.cost || 0)
    const value = toFixed(qty * wac, 2)
    return {
      id:         r.id,
      store:      r.store,
      product:    r.product,
      qty,
      uom:        r.product?.sellingUom || null,
      wac,
      value,
    }
  })
}

const lookups = async () => {
  const [stores, products] = await Promise.all([
    Store.findAll({ attributes: ['id', 'name', 'code'], order: [['name', 'ASC']] }),
    Product.findAll({ where: { status: 'active' }, attributes: ['id', 'name', 'sku'], order: [['name', 'ASC']] }),
  ])
  return { stores, products }
}

const getProductSummary = async (productId) => {
  const product = await Product.findByPk(productId, {
    include: [
      { model: UOM, as: 'sellingUom',    attributes: ['id', 'name', 'abbreviation'] },
      { model: UOM, as: 'purchasingUom', attributes: ['id', 'name', 'abbreviation'] },
    ],
  })
  if (!product) throw { status: 404, message: 'Product not found' }

  const storeStocks = await StoreStock.findAll({
    where: { productId },
    include: [{ model: Store, as: 'store', attributes: ['id', 'name', 'code'] }],
    order: [[{ model: Store, as: 'store' }, 'name', 'ASC']],
  })

  const movements = await StockMovement.findAll({
    where: { productId },
    order: [['createdAt', 'DESC']],
    limit: 20,
    include: [{ model: Store, as: 'store', attributes: ['id', 'name', 'code'] }],
  })

  const totalStock = storeStocks.reduce((s, r) => s + parseFloat(r.stock), 0)
  const wac        = parseFloat(product.cost || 0)
  const totalValue = toFixed(totalStock * wac, 2)

  return { product, storeStocks, movements, totalStock, totalValue }
}

module.exports = { list, lookups, getProductSummary }
