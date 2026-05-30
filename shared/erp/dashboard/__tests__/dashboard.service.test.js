// Unit tests for dashboard.service.getStats.
//
// The service fires ~23 parallel model calls and folds them into a single
// shape. We stub every model touchpoint with sensible defaults via a
// beforeEach helper, then override per test for the behavior we want to pin
// down. Notable invariants tested:
//   - sumBase folds doc-currency rows by total × exchangeRate
//   - AR overdue counts rows whose dueDate < today
//   - Missing chart of accounts → vatPeriod gracefully degrades to null
//   - Recent invoices / movements / low stock / per-store summary preserve
//     just the safe subset of fields (no model leakage)

jest.mock('../../../../server/models', () => ({
  Product: {
    count: jest.fn(), sum: jest.fn(), findAll: jest.fn(),
  },
  GoodReceive:         { count: jest.fn() },
  StockAdjust:         { count: jest.fn() },
  StockRequest:        { count: jest.fn() },
  StockMovement:       { findAll: jest.fn() },
  StoreStock:          { findAll: jest.fn() },
  Store:               {},
  Quotation:           { count: jest.fn() },
  Order:               { count: jest.fn() },
  DeliveryOrder:       { count: jest.fn() },
  Invoice:             { count: jest.fn(), sum: jest.fn(), findAll: jest.fn() },
  Customer:            {},
  PurchaseRequisition: { count: jest.fn() },
  PurchaseOrder:       { count: jest.fn() },
  Journal:             { count: jest.fn() },
  VendorBill:          { findAll: jest.fn() },
  TaxPeriod:           { findOne: jest.fn() },
}))

jest.mock('../../accounting/services/tax-period.service', () => ({
  getVatReport: jest.fn(),
}))

const m = require('../../../../server/models')
const taxPeriodSvc = require('../../accounting/services/tax-period.service')
const service = require('../dashboard.service')

// Sensible defaults so the 23-way Promise.all resolves; tests override
// whichever calls they care about.
function stubAllZero() {
  m.Product.count.mockResolvedValue(0)
  m.Product.sum.mockResolvedValue(0)
  m.Product.findAll.mockResolvedValue([])
  m.GoodReceive.count.mockResolvedValue(0)
  m.StockAdjust.count.mockResolvedValue(0)
  m.StockRequest.count.mockResolvedValue(0)
  m.StockMovement.findAll.mockResolvedValue([])
  m.StoreStock.findAll.mockResolvedValue([])
  m.Quotation.count.mockResolvedValue(0)
  m.Order.count.mockResolvedValue(0)
  m.DeliveryOrder.count.mockResolvedValue(0)
  m.Invoice.count.mockResolvedValue(0)
  m.Invoice.sum.mockResolvedValue(0)
  m.Invoice.findAll.mockResolvedValue([])
  m.PurchaseRequisition.count.mockResolvedValue(0)
  m.PurchaseOrder.count.mockResolvedValue(0)
  m.Journal.count.mockResolvedValue(0)
  m.VendorBill.findAll.mockResolvedValue([])
  m.TaxPeriod.findOne.mockResolvedValue(null)
}

beforeEach(stubAllZero)

describe('dashboard.getStats — output shape', () => {
  test('returns the canonical top-level keys (and nothing else)', async () => {
    const out = await service.getStats()
    expect(Object.keys(out).sort()).toEqual([
      'draftJournals',
      'finance',
      'invoices',
      'lowStockProducts',
      'pending',
      'products',
      'recentInvoices',
      'recentMovements',
      'sales',
      'storeStockSummary',
      'todayGoodReceives',
    ])
    expect(out.products).toEqual({ total: 0, active: 0, totalStock: 0, zeroStock: 0 })
    expect(out.finance).toMatchObject({ salesMtd: 0, arOutstanding: 0, arOverdueCount: 0, apOutstanding: 0, vatPeriod: null })
  })
})

describe('dashboard.getStats — finance/FX folding', () => {
  test('sumBase multiplies total × exchangeRate (defaults to 1 when rate missing)', async () => {
    // 3 sales invoices this month: 100 base, 200 @ 1.5 = 300, 50 with no rate = 50
    m.Invoice.findAll
      .mockResolvedValueOnce([])                                              // recentInvoices
      .mockResolvedValueOnce([                                                // salesMtdRows
        { total: 100, exchangeRate: 1 },
        { total: 200, exchangeRate: 1.5 },
        { total: 50,  exchangeRate: null },
      ])
      .mockResolvedValueOnce([])                                              // arSentRows

    const out = await service.getStats()
    // 100*1 + 200*1.5 + 50*1 = 100 + 300 + 50 = 450
    expect(out.finance.salesMtd).toBe(450)
  })

  test('arOverdueCount counts only sent invoices whose dueDate < today', async () => {
    const today    = new Date()
    const past     = new Date(today); past.setDate(past.getDate() - 5)
    const future   = new Date(today); future.setDate(future.getDate() + 5)
    const iso = (d) => d.toISOString().slice(0, 10)

    m.Invoice.findAll
      .mockResolvedValueOnce([])  // recentInvoices
      .mockResolvedValueOnce([])  // salesMtdRows
      .mockResolvedValueOnce([
        { total: 100, exchangeRate: 1, dueDate: iso(past)   }, // overdue
        { total: 200, exchangeRate: 1, dueDate: iso(past)   }, // overdue
        { total: 300, exchangeRate: 1, dueDate: iso(future) }, // not yet
        { total: 50,  exchangeRate: 1, dueDate: null        }, // no due → never overdue
      ])

    const out = await service.getStats()
    expect(out.finance.arOutstanding).toBe(650)
    expect(out.finance.arOverdueCount).toBe(2)
  })

  test('apOutstanding sums approved vendor bills in base currency', async () => {
    m.VendorBill.findAll.mockResolvedValue([
      { total: 100, exchangeRate: 35 },  // USD 100 @ 35 = THB 3500
      { total: 200, exchangeRate: 1  },  // base 200
    ])
    const out = await service.getStats()
    expect(out.finance.apOutstanding).toBe(3700)
  })
})

describe('dashboard.getStats — VAT period integration', () => {
  test('current open period → calls getVatReport and exposes the totals', async () => {
    m.TaxPeriod.findOne.mockResolvedValue({ id: 'p1', name: 'Q1', startDate: '2025-01-01', endDate: '2025-03-31' })
    taxPeriodSvc.getVatReport.mockResolvedValue({
      outputTax: { total: 700 }, inputTax: { total: 200 }, netPayable: 500,
    })
    const out = await service.getStats('org-1')
    expect(taxPeriodSvc.getVatReport).toHaveBeenCalledWith('p1', 'org-1')
    expect(out.finance.vatPeriod).toEqual({
      id: 'p1', name: 'Q1', startDate: '2025-01-01', endDate: '2025-03-31',
      outputTax: 700, inputTax: 200, netPayable: 500,
    })
  })

  test('VAT report failure (e.g. missing CoA) degrades to vatPeriod: null', async () => {
    m.TaxPeriod.findOne.mockResolvedValue({ id: 'p1', name: 'Q1' })
    taxPeriodSvc.getVatReport.mockRejectedValue({ status: 400, message: 'CoA missing' })
    const out = await service.getStats('org-1')
    expect(out.finance.vatPeriod).toBeNull()
  })

  test('no current period → never calls getVatReport', async () => {
    m.TaxPeriod.findOne.mockResolvedValue(null)
    await service.getStats('org-1')
    expect(taxPeriodSvc.getVatReport).not.toHaveBeenCalled()
  })

  test('organizationId only added to the period query when supplied', async () => {
    await service.getStats() // no org
    let where = m.TaxPeriod.findOne.mock.calls[0][0].where
    expect(where).not.toHaveProperty('organizationId')

    jest.clearAllMocks()
    stubAllZero()
    await service.getStats('org-1')
    where = m.TaxPeriod.findOne.mock.calls[0][0].where
    expect(where.organizationId).toBe('org-1')
  })
})

describe('dashboard.getStats — row mapping', () => {
  test('recentInvoices only exposes the safe subset of fields', async () => {
    m.Invoice.findAll
      .mockResolvedValueOnce([
        {
          id: 'i1', invoiceNumber: 'INV-1', status: 'sent',
          invoiceDate: '2025-01-05', dueDate: '2025-02-05', total: '123.45',
          customer: { id: 'c', name: 'Acme', secretField: 'should-not-leak' },
          dataValues: { extra: 'should-not-leak' },
        },
      ])
      .mockResolvedValueOnce([])  // salesMtdRows
      .mockResolvedValueOnce([])  // arSentRows

    const out = await service.getStats()
    expect(out.recentInvoices).toHaveLength(1)
    expect(out.recentInvoices[0]).toEqual({
      id: 'i1', invoiceNumber: 'INV-1', status: 'sent',
      invoiceDate: '2025-01-05', dueDate: '2025-02-05',
      total: 123.45, // parseFloat applied
      customer: { id: 'c', name: 'Acme' },
    })
  })

  test('recentInvoices preserves null customer', async () => {
    m.Invoice.findAll
      .mockResolvedValueOnce([{ id: 'i1', invoiceNumber: 'INV-1', total: '10', customer: null }])
      .mockResolvedValueOnce([]).mockResolvedValueOnce([])
    const out = await service.getStats()
    expect(out.recentInvoices[0].customer).toBeNull()
  })

  test('recentMovements maps product + store down to {id,name(,sku)}', async () => {
    m.StockMovement.findAll.mockResolvedValue([
      {
        id: 'm1', type: 'in', qty: 5, stockAfter: 20, refNo: 'GR-1', createdAt: 'now',
        product: { id: 'p', name: 'Widget', sku: 'W-1', cost: 99 /* should not leak */ },
        store:   { id: 's', name: 'Main' },
      },
      {
        id: 'm2', type: 'out', qty: 1, stockAfter: 19, refNo: 'SI-1', createdAt: 'now',
        product: null, store: null,
      },
    ])
    const out = await service.getStats()
    expect(out.recentMovements[0]).toEqual({
      id: 'm1', type: 'in', qty: 5, stockAfter: 20, refNo: 'GR-1', createdAt: 'now',
      product: { id: 'p', name: 'Widget', sku: 'W-1' },
      store:   { id: 's', name: 'Main' },
    })
    expect(out.recentMovements[1].product).toBeNull()
    expect(out.recentMovements[1].store).toBeNull()
  })

  test('lowStockProducts is passed through with just the inventory fields', async () => {
    m.Product.findAll.mockResolvedValue([
      { id: 'p1', name: 'A', sku: 'A', stock: 2, reorderPoint: 5, reorderQty: 10, cost: 99 },
    ])
    const out = await service.getStats()
    expect(out.lowStockProducts).toEqual([
      { id: 'p1', name: 'A', sku: 'A', stock: 2, reorderPoint: 5, reorderQty: 10 },
    ])
  })

  test('storeStockSummary unwraps the sequelize-computed totalStock via getDataValue', async () => {
    m.StoreStock.findAll.mockResolvedValue([
      { store: { id: 's1', name: 'Main' },     getDataValue: (k) => k === 'totalStock' ? '150' : null },
      { store: { id: 's2', name: 'Backroom' }, getDataValue: (k) => k === 'totalStock' ? '40'  : null },
      { store: null,                            getDataValue: () => '0' }, // unassigned bucket
    ])
    const out = await service.getStats()
    expect(out.storeStockSummary).toEqual([
      { store: { id: 's1', name: 'Main' },     totalStock: 150 },
      { store: { id: 's2', name: 'Backroom' }, totalStock: 40 },
      { store: null,                            totalStock: 0 },
    ])
  })
})

describe('dashboard.getStats — straight counts', () => {
  test('top-level counts propagate through unchanged', async () => {
    m.Product.count.mockImplementation(async (q) => {
      // 4 Product.count calls, in order: total, active, zeroStock(stock<=0&active), unused…
      // We can't reliably tell them apart by call order under resetMocks, so just
      // assert the first three are wired by setting distinct return values per call.
      return q?.where?.status === 'active'
        ? (q.where.stock ? 7 : 25)  // zeroStock vs activeProducts
        : 42                         // totalProducts
    })
    m.Product.sum.mockResolvedValue(999)
    m.Quotation.count.mockResolvedValue(3)
    m.Order.count.mockResolvedValue(4)
    m.DeliveryOrder.count.mockResolvedValue(2)
    m.Invoice.count.mockResolvedValue(11)
    m.Invoice.sum.mockResolvedValue(5500.5)
    m.PurchaseRequisition.count.mockResolvedValue(1)
    m.PurchaseOrder.count.mockResolvedValue(2)
    m.Journal.count.mockResolvedValue(6)
    m.GoodReceive.count.mockResolvedValue(2)

    const out = await service.getStats()
    expect(out.products).toEqual({ total: 42, active: 25, totalStock: 999, zeroStock: 7 })
    expect(out.sales).toEqual({ openQuotations: 3, activeSalesOrders: 4, pendingDeliveries: 2 })
    expect(out.invoices).toEqual({ sentCount: 11, arAmount: 5500.5 })
    expect(out.pending).toEqual({
      goodReceives: 2,           // GoodReceive.count returns 2 for both calls
      stockRequests: 0,
      adjustments: 0,
      purchaseRequisitions: 1,
      purchaseOrders: 2,
    })
    expect(out.draftJournals).toBe(6)
    expect(out.todayGoodReceives).toBe(2)
  })
})

describe('dashboard.getExecutiveSummary — folding', () => {
  test('all-zero stats → empty alerts, zero net position', async () => {
    const out = await service.getExecutiveSummary()
    expect(out.finance).toMatchObject({ salesMtd: 0, arOutstanding: 0, apOutstanding: 0, netPosition: 0, vat: null })
    expect(out.operations.pendingApprovals).toBe(0)
    expect(out.alerts).toEqual([])
    expect(Object.keys(out).sort()).toEqual(['alerts', 'finance', 'inventory', 'operations', 'sales'])
  })

  test('net position = AR − AP; pending + alerts derived from the slices', async () => {
    const past = new Date(); past.setDate(past.getDate() - 5)
    const isoPast = past.toISOString().slice(0, 10)

    m.Invoice.findAll
      .mockResolvedValueOnce([])                                          // recentInvoices
      .mockResolvedValueOnce([])                                          // salesMtdRows
      .mockResolvedValueOnce([{ total: 500, exchangeRate: 1, dueDate: isoPast }]) // arSentRows → 500, overdue
    m.VendorBill.findAll.mockResolvedValue([{ total: 300, exchangeRate: 1 }])     // AP 300
    m.Product.findAll.mockResolvedValue([{ id: 'p1', name: 'A', sku: 'A', stock: 1, reorderPoint: 5, reorderQty: 10 }]) // 1 low-stock
    m.Product.count.mockImplementation(async (q) =>
      (q?.where?.status === 'active' && q?.where?.stock) ? 2 : 0)         // zeroStock = 2
    m.GoodReceive.count.mockResolvedValue(2)                             // pending GR (+ today GR)
    m.PurchaseOrder.count.mockResolvedValue(1)                          // pending PO
    m.Journal.count.mockResolvedValue(3)                               // draft journals

    const out = await service.getExecutiveSummary('org-1')

    expect(out.finance.arOutstanding).toBe(500)
    expect(out.finance.apOutstanding).toBe(300)
    expect(out.finance.netPosition).toBe(200)
    expect(out.finance.arOverdueCount).toBe(1)
    expect(out.inventory.outOfStock).toBe(2)
    expect(out.inventory.lowStock).toBe(1)
    // goodReceives(2) + PRs(0) + POs(1) + adjustments(0) + stockRequests(0)
    expect(out.operations.pendingApprovals).toBe(3)
    expect(out.alerts).toEqual([
      '1 overdue invoice(s) in AR',
      '2 product(s) out of stock',
      '1 product(s) at/below reorder point',
      '3 item(s) pending approval',
      '3 draft journal(s) to post',
    ])
  })
})

describe('dashboard.getStats — org scoping', () => {
  test('scopes every aggregate to the organization when one is supplied', async () => {
    await service.getStats('org-9')

    expect(m.Product.count.mock.calls[0][0].where.organizationId).toBe('org-9')
    expect(m.Invoice.sum.mock.calls[0][1].where.organizationId).toBe('org-9')
    expect(m.VendorBill.findAll.mock.calls[0][0].where.organizationId).toBe('org-9')
    expect(m.StockMovement.findAll.mock.calls[0][0].where.organizationId).toBe('org-9')

    // StoreStock has no organizationId — it's scoped through an inner join on Store
    const storeInclude = m.StoreStock.findAll.mock.calls[0][0].include[0]
    expect(storeInclude.where.organizationId).toBe('org-9')
    expect(storeInclude.required).toBe(true)
  })

  test('omits the org filter (and Store join stays optional) when no org is supplied', async () => {
    await service.getStats()

    expect(m.Product.count.mock.calls[0][0].where).not.toHaveProperty('organizationId')
    const storeInclude = m.StoreStock.findAll.mock.calls[0][0].include[0]
    expect(storeInclude.where).toBeUndefined()
    expect(storeInclude.required).toBe(false)
  })
})
