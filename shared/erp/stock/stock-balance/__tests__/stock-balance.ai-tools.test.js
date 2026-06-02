// Unit tests for the Stock Balance AI tool handlers (read-only queries). The
// handlers lazily `require` the stock-balance service, so we mock that module
// path and drive each tool's handler directly.
jest.mock('../stock-balance.service', () => ({
  list: jest.fn(), lookups: jest.fn(), getProductSummary: jest.fn(),
}))

const balanceSvc = require('../stock-balance.service')
const { tools, navTargets } = require('../ai-tools')

const ctx = { user: { id: 'u1', organizationId: 'o1' } }
const byName = Object.fromEntries(tools.map((t) => [t.name, t]))

beforeEach(() => jest.clearAllMocks())

describe('stock-balance ai-tools — registry', () => {
  test('exposes the read-only toolset and nav target', () => {
    expect(Object.keys(byName).sort()).toEqual(['get_product_stock', 'get_stock_balance'])
    expect(navTargets).toHaveProperty('stock_balance')
  })

  test('every tool is server-kind with a handler and object params', () => {
    for (const t of tools) {
      expect(t.kind).toBe('server')
      expect(typeof t.handler).toBe('function')
      expect(t.parameters.type).toBe('object')
    }
  })

  test('exposes no write tools', () => {
    const names = Object.keys(byName).join(' ')
    expect(names).not.toMatch(/create|update|delete|confirm/)
  })
})

describe('get_stock_balance', () => {
  test('lists all balances when no filters, clamps + sums value', async () => {
    balanceSvc.list.mockResolvedValue([
      { product: { name: 'Widget', sku: 'W1' }, store: { name: 'Main' }, qty: 5, uom: { abbreviation: 'pc' }, value: 50 },
      { product: { name: 'Gadget', sku: 'G1' }, store: { name: 'Main' }, qty: 2, uom: { abbreviation: 'pc' }, value: 20 },
    ])
    const { result, action } = await byName.get_stock_balance.handler({}, ctx)
    expect(balanceSvc.lookups).not.toHaveBeenCalled()
    expect(balanceSvc.list).toHaveBeenCalledWith({ storeId: '', productId: '', includeZero: false })
    expect(result.total).toBe(2)
    expect(result.totalValue).toBe(70)
    expect(result.balances[0]).toMatchObject({ product: 'Widget', store: 'Main', qty: 5 })
    expect(action.path).toBe('/erp/stock-balance')
  })

  test('resolves store + product filters via lookups', async () => {
    balanceSvc.lookups.mockResolvedValue({
      stores:   [{ id: 'st1', name: 'Main', code: 'M' }],
      products: [{ id: 'pr1', name: 'Widget', sku: 'W1' }],
    })
    balanceSvc.list.mockResolvedValue([])
    await byName.get_stock_balance.handler({ store: 'Main', product: 'Widget', includeZero: true }, ctx)
    expect(balanceSvc.list).toHaveBeenCalledWith({ storeId: 'st1', productId: 'pr1', includeZero: true })
  })

  test('reports an unknown store filter', async () => {
    balanceSvc.lookups.mockResolvedValue({ stores: [{ id: 'st1', name: 'Main', code: 'M' }], products: [] })
    const { result } = await byName.get_stock_balance.handler({ store: 'ghost' }, ctx)
    expect(result).toMatch(/No store matches/)
    expect(balanceSvc.list).not.toHaveBeenCalled()
  })
})

describe('get_product_stock', () => {
  test('resolves the product then returns the summary', async () => {
    balanceSvc.lookups.mockResolvedValue({ stores: [], products: [{ id: 'pr1', name: 'Widget', sku: 'W1' }] })
    balanceSvc.getProductSummary.mockResolvedValue({
      product: { name: 'Widget', sku: 'W1' }, totalStock: 7, totalValue: 70,
      storeStocks: [{ store: { name: 'Main' }, stock: 7 }],
      movements: [{ type: 'receive', qty: 7, store: { name: 'Main' }, createdAt: '2026-01-01' }],
    })
    const { result, action } = await byName.get_product_stock.handler({ product: 'W1' }, ctx)
    expect(balanceSvc.getProductSummary).toHaveBeenCalledWith('pr1')
    expect(result).toMatchObject({ product: 'Widget', totalStock: 7, totalValue: 70 })
    expect(result.byStore[0]).toMatchObject({ store: 'Main', qty: 7 })
    expect(result.recentMovements[0]).toMatchObject({ type: 'receive', qty: 7 })
    expect(action.path).toBe('/erp/stock-balance/product/pr1')
  })

  test('reports when the product is unknown', async () => {
    balanceSvc.lookups.mockResolvedValue({ stores: [], products: [{ id: 'pr1', name: 'Widget', sku: 'W1' }] })
    const { result } = await byName.get_product_stock.handler({ product: 'ghost' }, ctx)
    expect(result).toMatch(/No product matches/)
    expect(balanceSvc.getProductSummary).not.toHaveBeenCalled()
  })
})
