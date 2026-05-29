// Unit tests for reporting summary.service.getSummary.
//
// The service reuses the ERP dashboard service for snapshot KPIs (mocked here)
// and adds three chart-only aggregations computed from Invoice rows:
//   - salesTrend   : invoiced base-currency revenue bucketed into 12 months
//   - invoiceStatus: grouped counts folded into a fixed {draft,sent,paid,cancelled}
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

describe('summary.getSummary — shape & KPI mapping', () => {
  test('maps ERP stats into kpis / pipeline / arVsAp / stockByStore', async () => {
    const out = await service.getSummary()
    expect(Object.keys(out).sort()).toEqual([
      'arAging', 'arVsAp', 'invoiceStatus', 'kpis', 'pipeline', 'salesTrend', 'stockByStore',
    ])
    expect(out.kpis).toEqual({
      salesMtd: 1000, arOutstanding: 500, apOutstanding: 300,
      activeProducts: 8, totalStock: 200, sentInvoices: 5,
    })
    expect(out.pipeline).toEqual({ quotations: 3, orders: 4, deliveries: 2, invoices: 5 })
    expect(out.arVsAp).toEqual({ ar: 500, ap: 300 })
    expect(out.stockByStore).toEqual([{ store: { id: 's1', name: 'Main' }, totalStock: 150 }])
  })
})

describe('summary.getSummary — salesTrend', () => {
  test('returns 12 month buckets and folds total × exchangeRate into the current month', async () => {
    const now = new Date()
    const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    m.Invoice.findAll.mockResolvedValueOnce([
      { invoiceDate: `${curKey}-15`, total: 100, exchangeRate: 1 },
      { invoiceDate: `${curKey}-20`, total: 200, exchangeRate: 1.5 }, // 300 base
    ])

    const out = await service.getSummary()
    expect(out.salesTrend.labels).toHaveLength(12)
    expect(out.salesTrend.data).toHaveLength(12)
    expect(out.salesTrend.labels[11]).toBe(curKey)         // last bucket is the current month
    expect(out.salesTrend.data[11]).toBe(400)              // 100*1 + 200*1.5
    expect(out.salesTrend.data.slice(0, 11)).toEqual(Array(11).fill(0))
  })
})

describe('summary.getSummary — invoiceStatus', () => {
  test('folds grouped counts into a fixed status object', async () => {
    m.Invoice.findAll
      .mockResolvedValueOnce([])                                   // salesTrend
      .mockResolvedValueOnce([                                     // invoiceStatus
        { status: 'sent', count: 5 },
        { status: 'paid', count: 3 },
        { status: 'draft', count: 2 },
      ])
    const out = await service.getSummary()
    expect(out.invoiceStatus).toEqual({ draft: 2, sent: 5, paid: 3, cancelled: 0 })
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
        { total: 200, exchangeRate: 1, dueDate: iso(-15) },        // 15 days past → 1-30
        { total: 100, exchangeRate: 2, dueDate: iso(-45) },        // 45 days, x2 → 31-60 = 200
        { total: 300, exchangeRate: 1, dueDate: iso(-90) },        // 90 days → 60+
      ])
    const out = await service.getSummary()
    expect(out.arAging).toEqual({ current: 150, d1_30: 200, d31_60: 200, d60plus: 300 })
  })
})

describe('summary.getSummary — org scoping', () => {
  test('passes organizationId to getStats and the Invoice queries', async () => {
    await service.getSummary('org-7')
    expect(erpDashboard.getStats).toHaveBeenCalledWith('org-7')
    for (const call of m.Invoice.findAll.mock.calls) {
      expect(call[0].where.organizationId).toBe('org-7')
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
