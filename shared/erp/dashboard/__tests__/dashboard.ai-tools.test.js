// Unit tests for the Dashboard AI tool handlers. The handlers lazily require
// dashboard.service, so we mock getExecutiveSummary and assert each tool
// delegates with the right tenant scope and returns the correct slice + action.
jest.mock('../dashboard.service', () => ({
  getStats: jest.fn(),
  getExecutiveSummary: jest.fn(),
}))

const svc = require('../dashboard.service')
const { tools, navTargets } = require('../ai-tools')

const byName = Object.fromEntries(tools.map((t) => [t.name, t]))

const SUMMARY = {
  finance:   { salesMtd: 1000, arOutstanding: 500, arOverdueCount: 1, apOutstanding: 300, netPosition: 200, vat: { period: 'Q1', netPayable: 90 } },
  sales:     { openQuotations: 2, activeOrders: 3, pendingDeliveries: 1, sentInvoices: 4 },
  inventory: { activeProducts: 25, totalProducts: 30, stockOnHand: 900, outOfStock: 2, lowStock: 5 },
  operations:{ pendingApprovals: 3, pending: {}, draftJournals: 1, todayGoodReceives: 0 },
  alerts:    ['1 overdue invoice(s) in AR', '2 product(s) out of stock'],
}

beforeEach(() => {
  jest.clearAllMocks()
  svc.getExecutiveSummary.mockResolvedValue(SUMMARY)
})

describe('dashboard ai-tools — registry', () => {
  test('exposes the executive reporting tools and dashboard nav target', () => {
    expect(Object.keys(byName).sort()).toEqual(['executive_summary', 'financial_summary', 'inventory_summary'])
    expect(navTargets).toHaveProperty('dashboard')
  })

  test('all tools are parameterless server tools', () => {
    for (const t of tools) {
      expect(t.kind).toBe('server')
      expect(typeof t.handler).toBe('function')
      expect(t.parameters).toEqual({ type: 'object', properties: {} })
    }
  })

  test('dashboard summaries require the same permission as GET /dashboard/stats', () => {
    for (const t of tools) {
      expect(t.permissions).toEqual(['erp.products.list'])
    }
  })
})

// Reporting tools are read-only: they return data for the model to narrate
// and must NOT emit a navigate action (no page is opened).
describe('executive_summary', () => {
  test('returns the full summary (no action), scoped to the org', async () => {
    const { result, action } = await byName.executive_summary.handler({}, { user: { id: 'u1', organizationId: 'o1' } })
    expect(svc.getExecutiveSummary).toHaveBeenCalledWith('o1')
    expect(result).toBe(SUMMARY)
    expect(action).toBeUndefined()
  })

  test('falls back to user id when no organization', async () => {
    await byName.executive_summary.handler({}, { user: { id: 'u9' } })
    expect(svc.getExecutiveSummary).toHaveBeenCalledWith('u9')
  })
})

describe('financial_summary', () => {
  test('returns only the finance slice, no action', async () => {
    const { result, action } = await byName.financial_summary.handler({}, { user: { id: 'u1', organizationId: 'o1' } })
    expect(result).toBe(SUMMARY.finance)
    expect(result.netPosition).toBe(200)
    expect(action).toBeUndefined()
  })
})

describe('inventory_summary', () => {
  test('returns only the inventory slice, no action', async () => {
    const { result, action } = await byName.inventory_summary.handler({}, { user: { id: 'u1', organizationId: 'o1' } })
    expect(result).toBe(SUMMARY.inventory)
    expect(result.outOfStock).toBe(2)
    expect(action).toBeUndefined()
  })
})
