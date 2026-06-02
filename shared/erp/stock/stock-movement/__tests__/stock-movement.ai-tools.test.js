// Unit tests for the Stock Movement AI tool handler (read-only ledger query).
// The handler lazily `require`s the movement service, the store service, and the
// products resolver, so we mock those module paths.
jest.mock('../stock-movement.service', () => ({ list: jest.fn() }))
jest.mock('../../../inventory/services/store.service', () => ({ list: jest.fn() }))
jest.mock('../../../products/ai-tools/product.ai-tools', () => ({ resolveProduct: jest.fn() }))

const movementSvc = require('../stock-movement.service')
const storeSvc    = require('../../../inventory/services/store.service')
const { resolveProduct } = require('../../../products/ai-tools/product.ai-tools')
const { tools, navTargets } = require('../ai-tools')

const ctx = { user: { id: 'u1', organizationId: 'o1' } }
const byName = Object.fromEntries(tools.map((t) => [t.name, t]))

beforeEach(() => jest.clearAllMocks())

describe('stock-movement ai-tools — registry', () => {
  test('exposes the read-only toolset and nav target', () => {
    expect(Object.keys(byName).sort()).toEqual(['get_stock_movements'])
    expect(navTargets).toHaveProperty('stock_movements')
  })

  test('the tool is server-kind with a handler and object params', () => {
    for (const t of tools) {
      expect(t.kind).toBe('server')
      expect(typeof t.handler).toBe('function')
      expect(t.parameters.type).toBe('object')
    }
  })

  test('exposes no write tools', () => {
    expect(Object.keys(byName).join(' ')).not.toMatch(/create|update|delete|confirm/)
  })
})

describe('get_stock_movements', () => {
  test('lists with no filters, clamps the limit, slims rows', async () => {
    movementSvc.list.mockResolvedValue({ total: 1, movements: [
      { product: { name: 'Widget', sku: 'W1' }, store: { name: 'Main' }, type: 'receive', qty: 5, stockBefore: 0, stockAfter: 5, refNo: 'GR-1', createdAt: '2026-01-01' },
    ] })
    const { result, action } = await byName.get_stock_movements.handler({ limit: 999 }, ctx)
    expect(resolveProduct).not.toHaveBeenCalled()
    expect(storeSvc.list).not.toHaveBeenCalled()
    expect(movementSvc.list).toHaveBeenCalledWith({ productId: '', storeId: '', type: '', limit: 50 })
    expect(result.movements[0]).toMatchObject({ product: 'Widget', type: 'receive', qty: 5, before: 0, after: 5, ref: 'GR-1' })
    expect(action.path).toBe('/erp/stock-movements')
  })

  test('resolves product + store filters and passes the type', async () => {
    resolveProduct.mockResolvedValue({ product: { id: 'pr1', name: 'Widget' } })
    storeSvc.list.mockResolvedValue({ stores: [{ id: 'st1', name: 'Main', code: 'M' }] })
    movementSvc.list.mockResolvedValue({ total: 0, movements: [] })
    await byName.get_stock_movements.handler({ product: 'Widget', store: 'Main', type: 'issue' }, ctx)
    expect(movementSvc.list).toHaveBeenCalledWith({ productId: 'pr1', storeId: 'st1', type: 'issue', limit: 10 })
  })

  test('reports an unknown product without querying movements', async () => {
    resolveProduct.mockResolvedValue({ error: 'No product matches "ghost".' })
    const { result } = await byName.get_stock_movements.handler({ product: 'ghost' }, ctx)
    expect(result).toMatch(/No product matches/)
    expect(movementSvc.list).not.toHaveBeenCalled()
  })

  test('reports an ambiguous store filter', async () => {
    storeSvc.list.mockResolvedValue({ stores: [{ id: 'a', name: 'Main One' }, { id: 'b', name: 'Main Two' }] })
    const { result } = await byName.get_stock_movements.handler({ store: 'main' }, ctx)
    expect(result).toMatch(/Multiple stores match/)
    expect(movementSvc.list).not.toHaveBeenCalled()
  })
})
