const {
  Product, GoodReceive, StockAdjust, StockRequest, StockMovement, StoreStock, Store,
  Quotation, Order, DeliveryOrder,
  Invoice, Customer,
  PurchaseRequisition, PurchaseOrder,
  Journal,
  VendorBill, TaxPeriod,
} = require('../../../server/models')
const { Op, fn, col } = require('sequelize')

// Sum doc rows (with total + exchangeRate) into org base currency.
const sumBase = (rows) => rows.reduce((s, r) => {
  const total = Number(r.total) || 0
  const rate  = Number(r.exchangeRate) || 1
  return s + total * rate
}, 0)

const getStats = async (organizationId = null) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const isoToday   = today.toISOString().slice(0, 10)

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
    // Finance widgets (Tier 2 — all in base currency)
    salesMtdRows,
    arSentRows,
    apApprovedRows,
    currentTaxPeriod,
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
    // Sales MTD: all non-cancelled invoices this month
    Invoice.findAll({
      where: {
        status: { [Op.ne]: 'cancelled' },
        invoiceDate: { [Op.gte]: monthStart },
      },
      attributes: ['total', 'exchangeRate'],
    }),
    // Outstanding AR: sent invoices
    Invoice.findAll({
      where: { status: 'sent' },
      attributes: ['total', 'exchangeRate', 'dueDate'],
    }),
    // Outstanding AP: approved (unpaid) vendor bills
    VendorBill.findAll({
      where: { status: 'approved' },
      attributes: ['total', 'exchangeRate'],
    }),
    // Current open tax period containing today
    TaxPeriod.findOne({
      where: {
        status: 'open',
        dataFlag: { [Op.ne]: 2 },
        startDate: { [Op.lte]: isoToday },
        endDate:   { [Op.gte]: isoToday },
        ...(organizationId ? { organizationId } : {}),
      },
    }),
  ])

  // Compute base-currency totals + overdue count
  const salesMtdBase = sumBase(salesMtdRows)
  const arBase       = sumBase(arSentRows)
  const arOverdue    = arSentRows.filter(r => r.dueDate && r.dueDate < isoToday).length
  const apBase       = sumBase(apApprovedRows)

  // Current period VAT — call the report service if a period covers today
  let vatPeriodInfo = null
  if (currentTaxPeriod) {
    try {
      const taxPeriodSvc = require('../accounting/services/tax-period.service')
      const report = await taxPeriodSvc.getVatReport(currentTaxPeriod.id, organizationId)
      vatPeriodInfo = {
        id:          currentTaxPeriod.id,
        name:        currentTaxPeriod.name,
        startDate:   currentTaxPeriod.startDate,
        endDate:     currentTaxPeriod.endDate,
        outputTax:   report.outputTax.total,
        inputTax:    report.inputTax.total,
        netPayable:  report.netPayable,
      }
    } catch (_) { /* missing CoA — fall back to null */ }
  }

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
    finance: {
      salesMtd:        salesMtdBase,
      arOutstanding:   arBase,
      arOverdueCount:  arOverdue,
      apOutstanding:   apBase,
      vatPeriod:       vatPeriodInfo,
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
