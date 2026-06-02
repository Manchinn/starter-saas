// Unit tests for the Stock Count AI tool handlers (read-only lookups). The
// handlers lazily `require` the stock-count service, so we mock that module
// path and drive each tool's handler directly with a fake user ctx.
jest.mock('../stock-count.service', () => ({
  list: jest.fn(), getById: jest.fn(),
}))

const countSvc = require('../stock-count.service')
const { tools, navTargets } = require('../ai-tools')

const USER = { id: 'u1', organizationId: 'o1' }
const ctx  = { user: USER }
const byName = Object.fromEntries(tools.map((t) => [t.name, t]))

beforeEach(() => jest.clearAllMocks())

describe('stock-count ai-tools — registry', () => {
  test('exposes the read-only toolset and nav targets', () => {
    expect(Object.keys(byName).sort()).toEqual(['get_stock_count', 'list_stock_counts'])
    expect(navTargets).toHaveProperty('stock_counts_list')
    expect(navTargets).toHaveProperty('stock_counts_create')
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
    expect(names).not.toMatch(/create|update|delete|confirm|lock/)
  })
})

describe('list_stock_counts', () => {
  test('passes filters, clamps the limit, slims rows (incl. lock flag)', async () => {
    countSvc.list.mockResolvedValue({ total: 1, counts: [
      { id: 'c1', refNo: 'CNT-1', date: '2026-01-01', status: 'draft', store: { name: 'Main' }, movementLocked: true },
    ] })
    const { result, action } = await byName.list_stock_counts.handler({ search: 'cnt', limit: 999 }, ctx)
    expect(countSvc.list).toHaveBeenCalledWith(expect.objectContaining({ search: 'cnt', limit: 50, organizationId: 'o1' }))
    expect(result.counts[0]).toMatchObject({ refNo: 'CNT-1', store: 'Main', locked: true })
    expect(action.path).toBe('/erp/stock-count')
  })
})

describe('get_stock_count', () => {
  test('resolves by ref then returns items with variance', async () => {
    countSvc.list.mockResolvedValue({ counts: [{ id: 'c1', refNo: 'CNT-1' }] })
    countSvc.getById.mockResolvedValue({
      id: 'c1', refNo: 'CNT-1', status: 'draft', store: { name: 'Main' }, movementLocked: false,
      items: [{ product: { name: 'Widget' }, systemQty: 10, countedQty: 8 }],
    })
    const { result, action } = await byName.get_stock_count.handler({ search: 'CNT-1' }, ctx)
    expect(countSvc.getById).toHaveBeenCalledWith('c1')
    expect(result.items[0]).toMatchObject({ product: 'Widget', systemQty: 10, countedQty: 8, variance: -2 })
    expect(action.path).toBe('/erp/stock-count/c1')
  })

  test('reports when nothing matches', async () => {
    countSvc.list.mockResolvedValue({ counts: [] })
    const { result } = await byName.get_stock_count.handler({ search: 'ghost' }, ctx)
    expect(result).toMatch(/No stock count matches/)
    expect(countSvc.getById).not.toHaveBeenCalled()
  })

  test('asks to narrow on ambiguous ref', async () => {
    countSvc.list.mockResolvedValue({ counts: [{ id: 'c1', refNo: 'CNT-10' }, { id: 'c2', refNo: 'CNT-100' }] })
    const { result } = await byName.get_stock_count.handler({ search: 'CNT-1' }, ctx)
    expect(result).toMatch(/Multiple stock counts match/)
  })
})
