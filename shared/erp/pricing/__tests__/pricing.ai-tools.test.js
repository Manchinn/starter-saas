// Unit tests for the Pricing AI tool handlers. Handlers lazily `require` the
// pricing service, the sale-item service, and the customer-group resolver, so
// we mock those module paths and drive each tool's handler directly.
jest.mock('../pricing.service', () => ({
  list: jest.fn(), getById: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn(),
}))
jest.mock('../../sale/services/sale-item.service', () => ({
  list: jest.fn(),
}))
jest.mock('../../customers/ai-tools/customer-group.ai-tools', () => ({
  resolveGroupId: jest.fn(),
}))

const pricingSvc  = require('../pricing.service')
const saleItemSvc = require('../../sale/services/sale-item.service')
const { resolveGroupId } = require('../../customers/ai-tools/customer-group.ai-tools')
const { tools, navTargets } = require('../ai-tools')

const USER = { id: 'u1', organizationId: 'o1' }
const ctx  = { user: USER }
const byName = Object.fromEntries(tools.map((t) => [t.name, t]))

beforeEach(() => {
  jest.clearAllMocks()
  resolveGroupId.mockResolvedValue(null)
})

describe('pricing ai-tools — registry', () => {
  test('exposes the full toolset and nav targets', () => {
    expect(Object.keys(byName).sort()).toEqual([
      'create_pricing', 'delete_pricing', 'get_pricing', 'list_pricings', 'update_pricing',
    ])
    expect(navTargets).toHaveProperty('pricing_list')
    expect(navTargets).toHaveProperty('pricing_create')
  })

  test('every tool is server-kind with a handler and object params', () => {
    for (const t of tools) {
      expect(t.kind).toBe('server')
      expect(typeof t.handler).toBe('function')
      expect(t.parameters.type).toBe('object')
    }
  })
})

describe('create_pricing', () => {
  test('auto-codes, defaults currency, resolves group + sale item', async () => {
    saleItemSvc.list.mockResolvedValue({ items: [{ id: 'si1', name: 'Widget', code: 'WGT' }] })
    resolveGroupId.mockResolvedValue('g1')
    pricingSvc.create.mockResolvedValue({ id: 'p1', name: 'Retail', code: 'PRC-1', unitPrice: 9.5, currency: 'USD' })

    const { result, action } = await byName.create_pricing.handler(
      { name: 'Retail', unitPrice: 9.5, saleItem: 'Widget', customerGroup: 'VIP' }, ctx,
    )

    expect(pricingSvc.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Retail', unitPrice: 9.5, currency: 'USD', autoCode: true,
      saleItemId: 'si1', customerGroupId: 'g1', userId: 'u1', organizationId: 'o1',
    }))
    expect(result).toMatchObject({ id: 'p1', code: 'PRC-1', unitPrice: 9.5 })
    expect(action.path).toBe('/erp/pricing/p1/edit')
  })

  test('no sale item → saleItemId null, keeps a provided code', async () => {
    pricingSvc.create.mockResolvedValue({ id: 'p2', name: 'Wholesale', code: 'WS', unitPrice: 5, currency: 'USD' })
    await byName.create_pricing.handler({ name: 'Wholesale', unitPrice: 5, code: 'WS' }, ctx)
    expect(saleItemSvc.list).not.toHaveBeenCalled()
    expect(pricingSvc.create).toHaveBeenCalledWith(expect.objectContaining({ code: 'WS', autoCode: false, saleItemId: null }))
  })

  test('unknown sale item reports an error and does not create', async () => {
    saleItemSvc.list.mockResolvedValue({ items: [] })
    const { result } = await byName.create_pricing.handler({ name: 'x', unitPrice: 1, saleItem: 'ghost' }, ctx)
    expect(result).toMatch(/No sale item matches/)
    expect(pricingSvc.create).not.toHaveBeenCalled()
  })
})

describe('list_pricings', () => {
  test('clamps the limit and slims rows', async () => {
    pricingSvc.list.mockResolvedValue({ total: 1, pricings: [
      { id: 'p1', name: 'Retail', code: 'PRC-1', unitPrice: '9.50', currency: 'USD', status: 'active', customerGroup: { name: 'VIP' } },
    ] })
    const { result, action } = await byName.list_pricings.handler({ search: 're', limit: 999 }, ctx)
    expect(pricingSvc.list).toHaveBeenCalledWith(expect.objectContaining({ search: 're', limit: 50, organizationId: 'o1' }))
    expect(result.pricings[0]).toMatchObject({ name: 'Retail', unitPrice: 9.5, customerGroup: 'VIP' })
    expect(action.path).toBe('/erp/pricing')
  })
})

describe('get_pricing', () => {
  test('resolves then fetches full detail', async () => {
    pricingSvc.list.mockResolvedValue({ pricings: [{ id: 'p1', name: 'Retail', code: 'PRC-1' }] })
    pricingSvc.getById.mockResolvedValue({ id: 'p1', name: 'Retail', code: 'PRC-1', unitPrice: 9.5, currency: 'USD', description: 'std', saleItem: { name: 'Widget' } })
    const { result } = await byName.get_pricing.handler({ search: 'Retail' }, ctx)
    expect(pricingSvc.getById).toHaveBeenCalledWith('p1', 'o1')
    expect(result).toMatchObject({ id: 'p1', description: 'std', saleItem: 'Widget' })
  })

  test('reports when nothing matches', async () => {
    pricingSvc.list.mockResolvedValue({ pricings: [] })
    const { result } = await byName.get_pricing.handler({ search: 'ghost' }, ctx)
    expect(result).toMatch(/No price list matches/)
    expect(pricingSvc.getById).not.toHaveBeenCalled()
  })
})

describe('update_pricing', () => {
  test('updates only passed fields and resolves a new group', async () => {
    pricingSvc.list.mockResolvedValue({ pricings: [{ id: 'p1', name: 'Retail', code: 'PRC-1' }] })
    resolveGroupId.mockResolvedValue('g2')
    pricingSvc.update.mockResolvedValue({ id: 'p1', name: 'Retail', code: 'PRC-1' })

    const { result } = await byName.update_pricing.handler({ search: 'PRC-1', unitPrice: 12, customerGroup: 'Wholesale' }, ctx)
    expect(pricingSvc.update).toHaveBeenCalledWith('p1', { unitPrice: 12, customerGroupId: 'g2' }, 'u1', 'o1')
    expect(result.updated).toEqual(expect.arrayContaining(['unitPrice', 'customerGroupId']))
  })

  test('no fields → does not call update', async () => {
    pricingSvc.list.mockResolvedValue({ pricings: [{ id: 'p1', name: 'Retail' }] })
    const { result } = await byName.update_pricing.handler({ search: 'Retail' }, ctx)
    expect(pricingSvc.update).not.toHaveBeenCalled()
    expect(result).toMatch(/Nothing to update/)
  })
})

describe('delete_pricing', () => {
  test('removes a uniquely-resolved price list', async () => {
    pricingSvc.list.mockResolvedValue({ pricings: [{ id: 'p1', name: 'Retail', code: 'PRC-1' }] })
    pricingSvc.remove.mockResolvedValue()
    const { result, action } = await byName.delete_pricing.handler({ search: 'Retail' }, ctx)
    expect(pricingSvc.remove).toHaveBeenCalledWith('p1', 'o1')
    expect(result).toMatch(/Deleted price list Retail \(PRC-1\)/)
    expect(action.path).toBe('/erp/pricing')
  })

  test('does not delete when ambiguous', async () => {
    pricingSvc.list.mockResolvedValue({ pricings: [{ id: 'p1', name: 'Retail A' }, { id: 'p2', name: 'Retail B' }] })
    const { result } = await byName.delete_pricing.handler({ search: 'retail' }, ctx)
    expect(pricingSvc.remove).not.toHaveBeenCalled()
    expect(result).toMatch(/Multiple price lists match/)
  })
})
