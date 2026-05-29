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

  // Scope every aggregate to the caller's organization, matching the rest of
  // the ERP (see server/core/tenant.js). When no org is supplied (internal
  // calls / tests) the filter is omitted. StoreStock carries no organizationId
  // of its own, so it's scoped through its Store association instead.
  const scope = organizationId ? { organizationId } : {}
  const storeScope = organizationId ? { organizationId } : undefined

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
    Product.count({ where: { ...scope } }),
    Product.count({ where: { ...scope, status: 'active' } }),
    Product.sum('stock', { where: { ...scope } }) || 0,
    Product.count({ where: { ...scope, stock: { [Op.lte]: 0 }, status: 'active' } }),
    GoodReceive.count({ where: { ...scope, status: 'draft' } }),
    StockRequest.count({ where: { ...scope, status: 'draft' } }),
    StockAdjust.count({ where: { ...scope, status: 'draft' } }),
    GoodReceive.count({ where: { ...scope, createdAt: { [Op.gte]: today, [Op.lt]: tomorrow } } }),
    StockMovement.findAll({
      where: { ...scope },
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'sku'] },
        { model: Store,   as: 'store',   attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 8,
    }),
    Product.findAll({
      where: {
        ...scope,
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
    // StoreStock has no organizationId — scope through its Store (inner join
    // when an org is supplied) so only this org's stores are summed.
    StoreStock.findAll({
      attributes: ['storeId', [fn('SUM', col('stock')), 'totalStock']],
      include: [{ model: Store, as: 'store', attributes: ['id', 'name'], where: storeScope, required: !!organizationId }],
      group: ['storeId', 'store.id'],
      order: [[fn('SUM', col('stock')), 'DESC']],
    }),
    // Sales
    Quotation.count({ where: { ...scope, status: { [Op.in]: ['draft', 'sent'] } } }),
    Order.count({ where: { ...scope, status: { [Op.in]: ['confirmed', 'shipped'] } } }),
    DeliveryOrder.count({ where: { ...scope, status: { [Op.in]: ['confirmed', 'shipped'] } } }),
    // Billing / AR
    Invoice.count({ where: { ...scope, status: 'sent' } }),
    Invoice.sum('total', { where: { ...scope, status: 'sent' } }),
    // Purchasing
    PurchaseRequisition.count({ where: { ...scope, status: 'draft' } }),
    PurchaseOrder.count({ where: { ...scope, status: 'confirmed' } }),
    // Accounting
    Journal.count({ where: { ...scope, status: 'draft' } }),
    // Recent invoices
    Invoice.findAll({
      where: { ...scope },
      include: [{ model: Customer, as: 'customer', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
      limit: 6,
    }),
    // Sales MTD: all non-cancelled invoices this month
    Invoice.findAll({
      where: {
        ...scope,
        status: { [Op.ne]: 'cancelled' },
        invoiceDate: { [Op.gte]: monthStart },
      },
      attributes: ['total', 'exchangeRate'],
    }),
    // Outstanding AR: sent invoices
    Invoice.findAll({
      where: { ...scope, status: 'sent' },
      attributes: ['total', 'exchangeRate', 'dueDate'],
    }),
    // Outstanding AP: approved (unpaid) vendor bills
    VendorBill.findAll({
      where: { ...scope, status: 'approved' },
      attributes: ['total', 'exchangeRate'],
    }),
    // Current open tax period containing today
    TaxPeriod.findOne({
      where: {
        ...scope,
        status: 'open',
        dataFlag: { [Op.ne]: 2 },
        startDate: { [Op.lte]: isoToday },
        endDate:   { [Op.gte]: isoToday },
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
