// Unit tests for reporting summary.service.getSummary.
//
// The service reuses the ERP dashboard service for current-snapshot KPIs
// (mocked here) and adds three date-scoped aggregations computed from Invoice
// rows within the [from, to] window (default: last 30 days):
//   - salesTrend   : invoiced base-currency revenue, daily/monthly buckets
//   - invoiceStatus: grouped counts folded into {draft,sent,paid,cancelled}
//   - arAging      : sent-invoice balances bucketed by dueDate age
// Invoice.findAll is called in a deterministic order (trend → status → aging)
// inside Promise.all, so mockResolvedValueOnce can pin each.

jest.mock('../../../../server/models', () => ({
  Invoice: { findAll: jest.fn() },
}))

jest.mock('../../../erp/dashboard/dashboard.service', () => ({
  getStats: jest.fn(),
}))

const m = require('../../../../server/models')
const erpDashboard = require('../../../erp/dashboard/dashboard.service')
const service = require('../summary.service')

const pad = (n) => String(n).padStart(2, '0')
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const todayYmd = ymd(new Date())

const statsFixture = {
  finance:  { salesMtd: 1000, arOutstanding: 500, apOutstanding: 300, arOverdueCount: 1, vatPeriod: null },
  products: { total: 10, active: 8, totalStock: 200, zeroStock: 1 },
  sales:    { openQuotations: 3, activeSalesOrders: 4, pendingDeliveries: 2 },
  invoices: { sentCount: 5, arAmount: 500 },
  storeStockSummary: [{ store: { id: 's1', name: 'Main' }, totalStock: 150 }],
}

beforeEach(() => {
  jest.clearAllMocks()
  erpDashboard.getStats.mockResolvedValue(statsFixture)
  m.Invoice.findAll.mockResolvedValue([])
})

describe('summary.getSummary — shape, range & KPI mapping', () => {
  test('includes a resolved range defaulting to the last 30 days (daily granularity)', async () => {
    const out = await service.getSummary()
    expect(Object.keys(out).sort()).toEqual([
      'arAging', 'arVsAp', 'invoiceStatus', 'kpis', 'pipeline', 'range', 'salesTrend', 'stockByStore',
    ])
    expect(out.range.to).toBe(todayYmd)
    expect(out.range.days).toBe(30)
    expect(out.range.granularity).toBe('day')
  })

  test('maps period + snapshot KPIs', async () => {
    const out = await service.getSummary()
    expect(out.kpis).toEqual({
      salesInPeriod: 0, invoicesInPeriod: 0,
      arOutstanding: 500, apOutstanding: 300,
      activeProducts: 8, totalStock: 200,
    })
    expect(out.pipeline).toEqual({ quotations: 3, orders: 4, deliveries: 2, invoices: 5 })
    expect(out.arVsAp).toEqual({ ar: 500, ap: 300 })
    expect(out.stockByStore).toEqual([{ store: { id: 's1', name: 'Main' }, totalStock: 150 }])
  })
})

describe('summary.getSummary — salesTrend', () => {
  test('daily range yields 30 buckets and folds total × exchangeRate into today', async () => {
    m.Invoice.findAll.mockResolvedValueOnce([
      { invoiceDate: todayYmd, total: 100, exchangeRate: 1 },
      { invoiceDate: todayYmd, total: 200, exchangeRate: 1.5 }, // 300 base
    ])
    const out = await service.getSummary()
    expect(out.salesTrend.granularity).toBe('day')
    expect(out.salesTrend.labels).toHaveLength(30)
    expect(out.salesTrend.data).toHaveLength(30)
    expect(out.salesTrend.labels[29]).toBe(todayYmd)
    expect(out.salesTrend.data[29]).toBe(400)
    expect(out.salesTrend.total).toBe(400)
    expect(out.kpis.salesInPeriod).toBe(400)
    expect(out.salesTrend.data.slice(0, 29)).toEqual(Array(29).fill(0))
  })

  test('a window longer than 92 days switches to monthly buckets', async () => {
    const out = await service.getSummary(null, { from: '2025-01-01', to: '2025-12-31' })
    expect(out.range.granularity).toBe('month')
    expect(out.salesTrend.labels).toHaveLength(12)
    expect(out.salesTrend.labels[0]).toBe('2025-01')
    expect(out.salesTrend.labels[11]).toBe('2025-12')
  })
})

describe('summary.getSummary — invoiceStatus & invoicesInPeriod', () => {
  test('folds grouped counts and derives invoicesInPeriod from the sum', async () => {
    m.Invoice.findAll
      .mockResolvedValueOnce([])                                   // salesTrend
      .mockResolvedValueOnce([                                     // invoiceStatus
        { status: 'sent', count: 5 },
        { status: 'paid', count: 3 },
        { status: 'draft', count: 2 },
      ])
    const out = await service.getSummary()
    expect(out.invoiceStatus).toEqual({ draft: 2, sent: 5, paid: 3, cancelled: 0 })
    expect(out.kpis.invoicesInPeriod).toBe(10)
  })
})

describe('summary.getSummary — arAging', () => {
  test('buckets sent invoices by dueDate age (base currency)', async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const iso = (offsetDays) => {
      const d = new Date(today); d.setDate(d.getDate() + offsetDays)
      return d.toISOString().slice(0, 10)
    }
    m.Invoice.findAll
      .mockResolvedValueOnce([])                                   // salesTrend
      .mockResolvedValueOnce([])                                   // invoiceStatus
      .mockResolvedValueOnce([                                     // arAging
        { total: 100, exchangeRate: 1, dueDate: iso(10) },         // not due → current
        { total: 50,  exchangeRate: 1, dueDate: null },            // no due → current
        { total: 200, exchangeRate: 1, dueDate: iso(-15) },        // 15 days → 1-30
        { total: 100, exchangeRate: 2, dueDate: iso(-45) },        // 45 days, x2 → 31-60 = 200
        { total: 300, exchangeRate: 1, dueDate: iso(-90) },        // 90 days → 60+
      ])
    const out = await service.getSummary()
    expect(out.arAging).toEqual({ current: 150, d1_30: 200, d31_60: 200, d60plus: 300 })
  })
})

describe('summary.getSummary — date scoping & org scoping', () => {
  test('scopes every Invoice query by the date window and organization', async () => {
    await service.getSummary('org-7', { from: '2025-03-01', to: '2025-03-31' })
    expect(erpDashboard.getStats).toHaveBeenCalledWith('org-7')
    expect(m.Invoice.findAll.mock.calls).toHaveLength(3)
    for (const call of m.Invoice.findAll.mock.calls) {
      expect(call[0].where.organizationId).toBe('org-7')
      expect(call[0].where.invoiceDate).toBeDefined()
    }
  })

  test('omits organizationId when none is supplied', async () => {
    await service.getSummary()
    expect(erpDashboard.getStats).toHaveBeenCalledWith(null)
    for (const call of m.Invoice.findAll.mock.calls) {
      expect(call[0].where).not.toHaveProperty('organizationId')
    }
  })
})
