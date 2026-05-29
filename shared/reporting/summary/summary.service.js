const { Invoice } = require('../../../server/models')
const { Op, fn, col } = require('sequelize')
const erpDashboard = require('../../erp/dashboard/dashboard.service')

const MONTHS_BACK = 12

// Fold a doc row into org base currency (total × exchangeRate), matching the
// rest of the ERP (see shared/erp/dashboard/dashboard.service.js).
const baseOf = (r) => (Number(r.total) || 0) * (Number(r.exchangeRate) || 1)
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

// Invoiced revenue per month (base currency) for the last MONTHS_BACK months.
// Bucketed in JS so the query stays portable across SQLite/Postgres.
const buildSalesTrend = async (scope) => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(1)
  start.setMonth(start.getMonth() - (MONTHS_BACK - 1))

  const rows = await Invoice.findAll({
    where: {
      ...scope,
      status: { [Op.ne]: 'cancelled' },
      invoiceDate: { [Op.gte]: start.toISOString().slice(0, 10) },
    },
    attributes: ['invoiceDate', 'total', 'exchangeRate'],
  })

  const keys = []
  const buckets = new Map()
  for (let i = 0; i < MONTHS_BACK; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1)
    const key = monthKey(d)
    keys.push(key)
    buckets.set(key, 0)
  }
  for (const r of rows) {
    const key = String(r.invoiceDate).slice(0, 7)
    if (buckets.has(key)) buckets.set(key, buckets.get(key) + baseOf(r))
  }
  return { labels: keys, data: keys.map((k) => buckets.get(k)) }
}

// Count of invoices by lifecycle status, for a doughnut breakdown.
const buildInvoiceStatus = async (scope) => {
  const rows = await Invoice.findAll({
    where: { ...scope },
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    group: ['status'],
    raw: true,
  })
  const out = { draft: 0, sent: 0, paid: 0, cancelled: 0 }
  for (const r of rows) {
    if (out[r.status] != null) out[r.status] = Number(r.count)
  }
  return out
}

// Outstanding AR (sent invoices) split into ageing buckets by dueDate, in base
// currency. Invoices with no due date are treated as current.
const buildArAging = async (scope) => {
  const rows = await Invoice.findAll({
    where: { ...scope, status: 'sent' },
    attributes: ['total', 'exchangeRate', 'dueDate'],
  })
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const out = { current: 0, d1_30: 0, d31_60: 0, d60plus: 0 }
  for (const r of rows) {
    const base = baseOf(r)
    if (!r.dueDate) { out.current += base; continue }
    const due = new Date(r.dueDate)
    const days = Math.floor((today - due) / 86400000)
    if (days <= 0) out.current += base
    else if (days <= 30) out.d1_30 += base
    else if (days <= 60) out.d31_60 += base
    else out.d60plus += base
  }
  return out
}

// Aggregate ERP data into a chart-ready summary. Snapshot KPIs and per-store
// stock reuse the (already tested) ERP dashboard service; the time-series and
// breakdown widgets below are computed here.
const getSummary = async (organizationId = null) => {
  const scope = organizationId ? { organizationId } : {}

  const [stats, salesTrend, invoiceStatus, arAging] = await Promise.all([
    erpDashboard.getStats(organizationId),
    buildSalesTrend(scope),
    buildInvoiceStatus(scope),
    buildArAging(scope),
  ])

  return {
    kpis: {
      salesMtd:       stats.finance.salesMtd,
      arOutstanding:  stats.finance.arOutstanding,
      apOutstanding:  stats.finance.apOutstanding,
      activeProducts: stats.products.active,
      totalStock:     stats.products.totalStock,
      sentInvoices:   stats.invoices.sentCount,
    },
    salesTrend,
    invoiceStatus,
    pipeline: {
      quotations: stats.sales.openQuotations,
      orders:     stats.sales.activeSalesOrders,
      deliveries: stats.sales.pendingDeliveries,
      invoices:   stats.invoices.sentCount,
    },
    arVsAp: { ar: stats.finance.arOutstanding, ap: stats.finance.apOutstanding },
    stockByStore: stats.storeStockSummary,
    arAging,
  }
}

module.exports = { getSummary }
