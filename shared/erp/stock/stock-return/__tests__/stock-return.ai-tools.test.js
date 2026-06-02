// Unit tests for the Stock Return AI tool handlers (read-only lookups). The
// handlers lazily `require` the stock-return service, so we mock that module
// path and drive each tool's handler directly with a fake user ctx.
jest.mock('../stock-return.service', () => ({
  list: jest.fn(), getById: jest.fn(),
}))

const returnSvc = require('../stock-return.service')
const { tools, navTargets } = require('../ai-tools')

const USER = { id: 'u1', organizationId: 'o1' }
const ctx  = { user: USER }
const byName = Object.fromEntries(tools.map((t) => [t.name, t]))

beforeEach(() => jest.clearAllMocks())

describe('stock-return ai-tools — registry', () => {
  test('exposes the read-only toolset and nav targets', () => {
    expect(Object.keys(byName).sort()).toEqual(['get_stock_return', 'list_stock_returns'])
    expect(navTargets).toHaveProperty('stock_returns_list')
    expect(navTargets).toHaveProperty('stock_returns_create')
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

describe('list_stock_returns', () => {
  test('passes filters, clamps the limit, slims rows', async () => {
    returnSvc.list.mockResolvedValue({ total: 1, returns: [
      { id: 'r1', refNo: 'RTN-1', date: '2026-01-01', status: 'confirmed', type: 'customer_return', store: { name: 'Main' }, customer: { name: 'Acme' }, vendor: null },
    ] })
    const { result, action } = await byName.list_stock_returns.handler({ search: 'rtn', type: 'customer_return', limit: 999 }, ctx)
    expect(returnSvc.list).toHaveBeenCalledWith(expect.objectContaining({
      search: 'rtn', type: 'customer_return', limit: 50, organizationId: 'o1',
    }))
    expect(result.returns[0]).toMatchObject({ refNo: 'RTN-1', type: 'customer_return', customer: 'Acme' })
    expect(action.path).toBe('/erp/stock-return')
  })
})

describe('get_stock_return', () => {
  test('resolves by ref then returns header + items', async () => {
    returnSvc.list.mockResolvedValue({ returns: [{ id: 'r1', refNo: 'RTN-1' }] })
    returnSvc.getById.mockResolvedValue({
      id: 'r1', refNo: 'RTN-1', status: 'draft', type: 'vendor_return', store: { name: 'Main' }, vendor: { name: 'Supplier' },
      items: [{ product: { name: 'Widget' }, qty: 2, notes: 'defective' }],
    })
    const { result, action } = await byName.get_stock_return.handler({ search: 'RTN-1' }, ctx)
    expect(returnSvc.getById).toHaveBeenCalledWith('r1')
    expect(result).toMatchObject({ type: 'vendor_return', vendor: 'Supplier' })
    expect(result.items[0]).toMatchObject({ product: 'Widget', qty: 2, notes: 'defective' })
    expect(action.path).toBe('/erp/stock-return/r1')
  })

  test('reports when nothing matches', async () => {
    returnSvc.list.mockResolvedValue({ returns: [] })
    const { result } = await byName.get_stock_return.handler({ search: 'ghost' }, ctx)
    expect(result).toMatch(/No stock return matches/)
    expect(returnSvc.getById).not.toHaveBeenCalled()
  })

  test('asks to narrow on ambiguous ref', async () => {
    returnSvc.list.mockResolvedValue({ returns: [{ id: 'r1', refNo: 'RTN-10' }, { id: 'r2', refNo: 'RTN-100' }] })
    const { result } = await byName.get_stock_return.handler({ search: 'RTN-1' }, ctx)
    expect(result).toMatch(/Multiple stock returns match/)
  })
})
