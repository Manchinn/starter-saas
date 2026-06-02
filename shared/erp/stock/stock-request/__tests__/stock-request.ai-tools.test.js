// Unit tests for the Stock Request (transfer) AI tool handlers (read-only
// lookups). The handlers lazily `require` the stock-request service, so we mock
// that module path and drive each tool's handler directly with a fake user ctx.
jest.mock('../stock-request.service', () => ({
  list: jest.fn(), getById: jest.fn(),
}))

const requestSvc = require('../stock-request.service')
const { tools, navTargets } = require('../ai-tools')

const USER = { id: 'u1', organizationId: 'o1' }
const ctx  = { user: USER }
const byName = Object.fromEntries(tools.map((t) => [t.name, t]))

beforeEach(() => jest.clearAllMocks())

describe('stock-request ai-tools — registry', () => {
  test('exposes the read-only toolset and nav targets', () => {
    expect(Object.keys(byName).sort()).toEqual(['get_stock_transfer', 'list_stock_transfers'])
    expect(navTargets).toHaveProperty('stock_requests_list')
    expect(navTargets).toHaveProperty('stock_requests_create')
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

describe('list_stock_transfers', () => {
  test('passes filters, clamps the limit, slims rows with from/to stores', async () => {
    requestSvc.list.mockResolvedValue({ total: 1, requests: [
      { id: 'r1', refNo: 'STR-1', date: '2026-01-01', status: 'confirmed', fromStore: { name: 'Main' }, toStore: { name: 'Branch' } },
    ] })
    const { result, action } = await byName.list_stock_transfers.handler({ search: 'str', limit: 999 }, ctx)
    expect(requestSvc.list).toHaveBeenCalledWith(expect.objectContaining({ search: 'str', limit: 50, organizationId: 'o1' }))
    expect(result.transfers[0]).toMatchObject({ refNo: 'STR-1', fromStore: 'Main', toStore: 'Branch' })
    expect(action.path).toBe('/erp/stock-request')
  })
})

describe('get_stock_transfer', () => {
  test('resolves by ref then returns header + items', async () => {
    requestSvc.list.mockResolvedValue({ requests: [{ id: 'r1', refNo: 'STR-1' }] })
    requestSvc.getById.mockResolvedValue({
      id: 'r1', refNo: 'STR-1', status: 'draft', fromStore: { name: 'Main' }, toStore: { name: 'Branch' },
      items: [{ product: { name: 'Widget' }, qty: 6, notes: 'restock' }],
    })
    const { result, action } = await byName.get_stock_transfer.handler({ search: 'STR-1' }, ctx)
    expect(requestSvc.getById).toHaveBeenCalledWith('r1')
    expect(result).toMatchObject({ fromStore: 'Main', toStore: 'Branch' })
    expect(result.items[0]).toMatchObject({ product: 'Widget', qty: 6, notes: 'restock' })
    expect(action.path).toBe('/erp/stock-request/r1')
  })

  test('reports when nothing matches', async () => {
    requestSvc.list.mockResolvedValue({ requests: [] })
    const { result } = await byName.get_stock_transfer.handler({ search: 'ghost' }, ctx)
    expect(result).toMatch(/No stock transfer matches/)
    expect(requestSvc.getById).not.toHaveBeenCalled()
  })

  test('asks to narrow on ambiguous ref', async () => {
    requestSvc.list.mockResolvedValue({ requests: [{ id: 'r1', refNo: 'STR-10' }, { id: 'r2', refNo: 'STR-100' }] })
    const { result } = await byName.get_stock_transfer.handler({ search: 'STR-1' }, ctx)
    expect(result).toMatch(/Multiple stock transfers match/)
  })
})
