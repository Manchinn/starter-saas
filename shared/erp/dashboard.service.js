const { Product, GoodReceive, StockAdjust, StockRequest, StockMovement, StoreStock, Store } = require('../../server/models')
const { Op, fn, col } = require('sequelize')

const getStats = async () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [
    totalProducts,
    activeProducts,
    totalStock,
    zeroStockCount,
    pendingGoodReceives,
    pendingStockRequests,
    pendingAdjustments,
    todayGoodReceives,
    recentMovements,
    lowStockProducts,
    storeStockSummary,
  ] = await Promise.all([
    Product.count(),
    Product.count({ where: { status: 'active' } }),
    Product.sum('stock') || 0,
    Product.count({ where: { stock: { [Op.lte]: 0 }, status: 'active' } }),
    GoodReceive.count({ where: { status: 'draft' } }),
    StockRequest.count({ where: { status: 'draft' } }),
    StockAdjust.count({ where: { status: 'draft' } }),
    GoodReceive.count({ where: { createdAt: { [Op.gte]: today, [Op.lt]: tomorrow } } }),
    StockMovement.findAll({
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'sku'] },
        { model: Store,   as: 'store',   attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 8,
    }),
    Product.findAll({
      where: { stock: { [Op.lte]: 5 }, status: 'active' },
      attributes: ['id', 'name', 'sku', 'stock'],
      order: [['stock', 'ASC']],
      limit: 10,
    }),
    StoreStock.findAll({
      attributes: ['storeId', [fn('SUM', col('stock')), 'totalStock']],
      include: [{ model: Store, as: 'store', attributes: ['id', 'name'] }],
      group: ['storeId', 'store.id'],
      order: [[fn('SUM', col('stock')), 'DESC']],
    }),
  ])

  return {
    products: {
      total: totalProducts,
      active: activeProducts,
      totalStock: parseFloat(totalStock || 0),
      zeroStock: zeroStockCount,
    },
    pending: {
      goodReceives: pendingGoodReceives,
      stockRequests: pendingStockRequests,
      adjustments: pendingAdjustments,
    },
    todayGoodReceives,
    recentMovements: recentMovements.map(m => ({
      id: m.id,
      type: m.type,
      qty: m.qty,
      stockAfter: m.stockAfter,
      refNo: m.refNo,
      createdAt: m.createdAt,
      product: m.product ? { id: m.product.id, name: m.product.name, sku: m.product.sku } : null,
      store: m.store ? { id: m.store.id, name: m.store.name } : null,
    })),
    lowStockProducts: lowStockProducts.map(p => ({
      id: p.id, name: p.name, sku: p.sku, stock: p.stock,
    })),
    storeStockSummary: storeStockSummary.map(s => ({
      store: s.store ? { id: s.store.id, name: s.store.name } : null,
      totalStock: parseFloat(s.getDataValue('totalStock') || 0),
    })),
  }
}

module.exports = { getStats }
