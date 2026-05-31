const { Invoice } = require('../../../server/models')
const { Op, fn, col } = require('sequelize')
const erpDashboard = require('../../erp/dashboard/dashboard.service')

const DEFAULT_DAYS = 30
// Above this window the trend switches from daily to monthly buckets so the
// x-axis stays readable.
const DAILY_MAX_DAYS = 92

// Fold a doc row into org base currency (total × exchangeRate).
const baseOf = (r) => (Number(r.total) || 0) * (Number(r.exchangeRate) || 1)

const pad = (n) => String(n).padStart(2, '0')
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
// Parse a 'YYYY-MM-DD' as local midnight so bucketing never drifts a day in
// negative-offset timezones.
const parseLocal = (s) => new Date(`${s}T00:00:00`)
const isYmd = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)

// Resolve an inclusive [from, to] window, defaulting to the last 30 days.
const resolveRange = ({ from, to } = {}) => {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  let f = isYmd(from) ? from : null
  let t = isYmd(to) ? to : null
  if (!f && !t) {
    const start = new Date(today); start.setDate(start.getDate() - (DEFAULT_DAYS - 1))
    f = ymd(start); t = ymd(today)
  } else if (f && !t) {
    t = ymd(today)
  } else if (!f && t) {
    const start = parseLocal(t); start.setDate(start.getDate() - (DEFAULT_DAYS - 1))
    f = ymd(start)
  }
  if (f > t) { const tmp = f; f = t; t = tmp }
  const days = Math.round((parseLocal(t) - parseLocal(f)) / 86400000) + 1
  const granularity = days <= DAILY_MAX_DAYS ? 'day' : 'month'
  return { from: f, to: t, days, granularity }
}

const dayKeys = (from, to) => {
  const keys = []
  const cur = parseLocal(from)
  const last = parseLocal(to)
  while (cur <= last) { keys.push(ymd(cur)); cur.setDate(cur.getDate() + 1) }
  return keys
}

const monthKeys = (from, to) => {
  const keys = []
  const start = parseLocal(from)
  const end = parseLocal(to)
  let y = start.getFullYear()
  let m = start.getMonth()
  while (y < end.getFullYear() || (y === end.getFullYear() && m <= end.getMonth())) {
    keys.push(`${y}-${pad(m + 1)}`)
    m++
    if (m > 11) { m = 0; y++ }
  }
  return keys
}

// Invoiced revenue (base currency) bucketed across the window — daily for short
// ranges, monthly for long ones. Returns the period total alongside the series.
const buildSalesTrend = async (scope, from, to, granularity) => {
  const rows = await Invoice.findAll({
    where: { ...scope, status: { [Op.ne]: 'cancelled' }, invoiceDate: { [Op.between]: [from, to] } },
    attributes: ['invoiceDate', 'total', 'exchangeRate'],
  })
  const keys = granularity === 'day' ? dayKeys(from, to) : monthKeys(from, to)
  const sliceLen = granularity === 'day' ? 10 : 7
  const buckets = new Map(keys.map((k) => [k, 0]))
  let total = 0
  for (const r of rows) {
    const base = baseOf(r)
    total += base
    const key = String(r.invoiceDate).slice(0, sliceLen)
    if (buckets.has(key)) buckets.set(key, buckets.get(key) + base)
  }
  return { granularity, labels: keys, data: keys.map((k) => buckets.get(k)), total }
}

// Count of invoices issued in the window, by lifecycle status.
const buildInvoiceStatus = async (scope, from, to) => {
  const rows = await Invoice.findAll({
    where: { ...scope, invoiceDate: { [Op.between]: [from, to] } },
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

// Outstanding AR for invoices issued in the window, aged by dueDate vs today.
const buildArAging = async (scope, from, to) => {
  const rows = await Invoice.findAll({
    where: { ...scope, status: 'sent', invoiceDate: { [Op.between]: [from, to] } },
    attributes: ['total', 'exchangeRate', 'dueDate'],
  })
  const today = new Date(); today.setHours(0, 0, 0, 0)
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

// Profitability for the window, from posted journals via the financial-statements
// service (revenue/COGS/gross profit/net profit). Zeros if the CoA isn't seeded.
const buildProfitability = async (organizationId, from, to) => {
  try {
    const fsSvc = require('../../erp/accounting/services/financial-statements.service')
    const is = await fsSvc.incomeStatementForPeriod({ fromDate: from, toDate: to, organizationId })
    const grossMarginPct = is.revenue > 0 ? Math.round((is.grossProfit / is.revenue) * 1000) / 10 : 0
    return { revenue: is.revenue, costOfSales: is.costOfSales, grossProfit: is.grossProfit, netProfit: is.netProfit, grossMarginPct }
  } catch (_) {
    return { revenue: 0, costOfSales: 0, grossProfit: 0, netProfit: 0, grossMarginPct: 0 }
  }
}

// Aggregate ERP data into a chart-ready summary. Invoice-based analytics are
// scoped to the [from, to] window; inventory and open-document tiles reuse the
// (already tested) ERP dashboard service and reflect the current snapshot.
const getSummary = async (organizationId = null, opts = {}) => {
  const scope = organizationId ? { organizationId } : {}
  const range = resolveRange(opts)

  const [stats, salesTrend, invoiceStatus, arAging, profit] = await Promise.all([
    erpDashboard.getStats(organizationId),
    buildSalesTrend(scope, range.from, range.to, range.granularity),
    buildInvoiceStatus(scope, range.from, range.to),
    buildArAging(scope, range.from, range.to),
    buildProfitability(organizationId, range.from, range.to),
  ])

  const invoicesInPeriod =
    invoiceStatus.draft + invoiceStatus.sent + invoiceStatus.paid + invoiceStatus.cancelled

  return {
    range,
    kpis: {
      salesInPeriod:    salesTrend.total,
      invoicesInPeriod,
      arOutstanding:    stats.finance.arOutstanding,
      apOutstanding:    stats.finance.apOutstanding,
      activeProducts:   stats.products.active,
      totalStock:       stats.products.totalStock,
      costOfSales:      profit.costOfSales,
      grossProfit:      profit.grossProfit,
      grossMarginPct:   profit.grossMarginPct,
      netProfit:        profit.netProfit,
    },
    profitability:      profit,
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
