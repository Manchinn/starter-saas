const {
  Product, GoodReceive, StockAdjust, StockRequest, StockMovement, StoreStock, Store,
  Quotation, Order, DeliveryOrder,
  Invoice, Customer,
  PurchaseRequisition, PurchaseOrder,
  Journal,
} = require('../../../server/models')
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
    openQuotations,
    activeSalesOrders,
    pendingDeliveries,
    sentInvoiceCount,
    arAmount,
    pendingPRs,
    pendingPOs,
    draftJournals,
    recentInvoices,
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
      where: {
        status: 'active',
        [Op.or]: [
          // Per-product reorder point set
          { reorderPoint: { [Op.not]: null }, stock: { [Op.lte]: col('reorderPoint') } },
          // Fallback for products without a reorder point: legacy threshold
          { reorderPoint: null, stock: { [Op.lte]: 5 } },
        ],
      },
      attributes: ['id', 'name', 'sku', 'stock', 'reorderPoint', 'reorderQty'],
      order: [['stock', 'ASC']],
      limit: 10,
    }),
    StoreStock.findAll({
      attributes: ['storeId', [fn('SUM', col('stock')), 'totalStock']],
      include: [{ model: Store, as: 'store', attributes: ['id', 'name'] }],
      group: ['storeId', 'store.id'],
      order: [[fn('SUM', col('stock')), 'DESC']],
    }),
    // Sales
    Quotation.count({ where: { status: { [Op.in]: ['draft', 'sent'] } } }),
    Order.count({ where: { status: { [Op.in]: ['confirmed', 'shipped'] } } }),
    DeliveryOrder.count({ where: { status: { [Op.in]: ['confirmed', 'shipped'] } } }),
    // Billing / AR
    Invoice.count({ where: { status: 'sent' } }),
    Invoice.sum('total', { where: { status: 'sent' } }),
    // Purchasing
    PurchaseRequisition.count({ where: { status: 'draft' } }),
    PurchaseOrder.count({ where: { status: 'confirmed' } }),
    // Accounting
    Journal.count({ where: { status: 'draft' } }),
    // Recent invoices
    Invoice.findAll({
      include: [{ model: Customer, as: 'customer', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
      limit: 6,
    }),
  ])

  return {
    products: {
      total: totalProducts,
      active: activeProducts,
      totalStock: parseFloat(totalStock || 0),
      zeroStock: zeroStockCount,
    },
    sales: {
      openQuotations,
      activeSalesOrders,
      pendingDeliveries,
    },
    invoices: {
      sentCount: sentInvoiceCount,
      arAmount:  parseFloat(arAmount || 0),
    },
    draftJournals,
    pending: {
      goodReceives:         pendingGoodReceives,
      stockRequests:        pendingStockRequests,
      adjustments:          pendingAdjustments,
      purchaseRequisitions: pendingPRs,
      purchaseOrders:       pendingPOs,
    },
    todayGoodReceives,
    recentInvoices: recentInvoices.map(inv => ({
      id:            inv.id,
      invoiceNumber: inv.invoiceNumber,
      status:        inv.status,
      invoiceDate:   inv.invoiceDate,
      dueDate:       inv.dueDate,
      total:         parseFloat(inv.total),
      customer:      inv.customer ? { id: inv.customer.id, name: inv.customer.name } : null,
    })),
    recentMovements: recentMovements.map(m => ({
      id:         m.id,
      type:       m.type,
      qty:        m.qty,
      stockAfter: m.stockAfter,
      refNo:      m.refNo,
      createdAt:  m.createdAt,
      product:    m.product ? { id: m.product.id, name: m.product.name, sku: m.product.sku } : null,
      store:      m.store   ? { id: m.store.id,   name: m.store.name }                       : null,
    })),
    lowStockProducts: lowStockProducts.map(p => ({
      id: p.id, name: p.name, sku: p.sku, stock: p.stock, reorderPoint: p.reorderPoint, reorderQty: p.reorderQty,
    })),
    storeStockSummary: storeStockSummary.map(s => ({
      store:      s.store ? { id: s.store.id, name: s.store.name } : null,
      totalStock: parseFloat(s.getDataValue('totalStock') || 0),
    })),
  }
}

module.exports = { getStats }
