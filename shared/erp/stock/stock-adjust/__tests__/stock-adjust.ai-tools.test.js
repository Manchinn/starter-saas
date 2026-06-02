// Unit tests for the Stock Adjustment AI tool handlers (read-only lookups). The
// handlers lazily `require` the stock-adjust service, so we mock that module
// path and drive each tool's handler directly with a fake user ctx.
jest.mock('../stock-adjust.service', () => ({
  list: jest.fn(), getById: jest.fn(),
}))

const adjSvc = require('../stock-adjust.service')
const { tools, navTargets } = require('../ai-tools')

const USER = { id: 'u1', organizationId: 'o1' }
const ctx  = { user: USER }
const byName = Object.fromEntries(tools.map((t) => [t.name, t]))

beforeEach(() => jest.clearAllMocks())

describe('stock-adjust ai-tools — registry', () => {
  test('exposes the read-only toolset and nav targets', () => {
    expect(Object.keys(byName).sort()).toEqual(['get_stock_adjustment', 'list_stock_adjustments'])
    expect(navTargets).toHaveProperty('stock_adjusts_list')
    expect(navTargets).toHaveProperty('stock_adjusts_create')
  })

  test('every tool is server-kind with a handler and object params', () => {
    for (const t of tools) {
      expect(t.kind).toBe('server')
      expect(typeof t.handler).toBe('function')
      expect(t.parameters.type).toBe('object')
    }
  })

  test('exposes no write/workflow tools', () => {
    const names = Object.keys(byName).join(' ')
    expect(names).not.toMatch(/create|update|delete|confirm/)
  })
})

describe('list_stock_adjustments', () => {
  test('passes filters, clamps the limit, slims rows', async () => {
    adjSvc.list.mockResolvedValue({ total: 1, adjustments: [
      { id: 'a1', refNo: 'ADJ-1', date: '2026-01-01', status: 'confirmed', reason: 'count fix', store: { name: 'Main' } },
    ] })
    const { result, action } = await byName.list_stock_adjustments.handler({ search: 'adj', limit: 999 }, ctx)
    expect(adjSvc.list).toHaveBeenCalledWith(expect.objectContaining({ search: 'adj', limit: 50, organizationId: 'o1' }))
    expect(result.adjustments[0]).toMatchObject({ refNo: 'ADJ-1', reason: 'count fix', store: 'Main' })
    expect(action.path).toBe('/erp/stock-adjust')
  })
})

describe('get_stock_adjustment', () => {
  test('resolves by ref then returns header + items', async () => {
    adjSvc.list.mockResolvedValue({ adjustments: [{ id: 'a1', refNo: 'ADJ-1' }] })
    adjSvc.getById.mockResolvedValue({
      id: 'a1', refNo: 'ADJ-1', status: 'draft', reason: 'breakage', store: { name: 'Main' },
      items: [{ product: { name: 'Widget' }, qty: -3, notes: 'damaged' }],
    })
    const { result, action } = await byName.get_stock_adjustment.handler({ search: 'ADJ-1' }, ctx)
    expect(adjSvc.getById).toHaveBeenCalledWith('a1')
    expect(result.items[0]).toMatchObject({ product: 'Widget', qty: -3, notes: 'damaged' })
    expect(action.path).toBe('/erp/stock-adjust/a1')
  })

  test('reports when nothing matches', async () => {
    adjSvc.list.mockResolvedValue({ adjustments: [] })
    const { result } = await byName.get_stock_adjustment.handler({ search: 'ghost' }, ctx)
    expect(result).toMatch(/No stock adjustment matches/)
    expect(adjSvc.getById).not.toHaveBeenCalled()
  })

  test('asks to narrow on ambiguous ref', async () => {
    adjSvc.list.mockResolvedValue({ adjustments: [{ id: 'a1', refNo: 'ADJ-10' }, { id: 'a2', refNo: 'ADJ-100' }] })
    const { result } = await byName.get_stock_adjustment.handler({ search: 'ADJ-1' }, ctx)
    expect(result).toMatch(/Multiple stock adjustments match/)
  })
})
