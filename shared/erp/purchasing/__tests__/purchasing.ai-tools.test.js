// Unit tests for the Purchasing AI tool handlers (read-only lookups for
// purchase orders + requisitions). Handlers lazily `require` their services, so
// we mock those module paths and drive each tool's handler directly.
jest.mock('../services/purchase-order.service', () => ({
  list: jest.fn(), getById: jest.fn(),
}))
jest.mock('../services/purchase-requisition.service', () => ({
  list: jest.fn(), getById: jest.fn(),
}))

const poSvc = require('../services/purchase-order.service')
const prSvc = require('../services/purchase-requisition.service')
const { tools, navTargets } = require('../ai-tools')

const USER = { id: 'u1', organizationId: 'o1' }
const ctx  = { user: USER }
const byName = Object.fromEntries(tools.map((t) => [t.name, t]))

beforeEach(() => jest.clearAllMocks())

describe('purchasing ai-tools — registry', () => {
  test('exposes the read-only toolset and nav targets', () => {
    expect(Object.keys(byName).sort()).toEqual([
      'get_purchase_order', 'get_purchase_requisition',
      'list_purchase_orders', 'list_purchase_requisitions',
    ])
    expect(navTargets).toHaveProperty('purchase_orders_list')
    expect(navTargets).toHaveProperty('purchase_requisitions_list')
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
    expect(names).not.toMatch(/create|update|delete|confirm|receive|cancel|approve/)
  })
})

describe('purchase orders', () => {
  test('list passes filters, clamps the limit, slims rows', async () => {
    poSvc.list.mockResolvedValue({ total: 1, orders: [
      { id: 'po1', refNo: 'PO-1', date: '2026-01-01', status: 'draft', vendor: { name: 'Acme' }, currency: 'USD' },
    ] })
    const { result, action } = await byName.list_purchase_orders.handler({ status: 'draft', limit: 999 }, ctx)
    expect(poSvc.list).toHaveBeenCalledWith(expect.objectContaining({ status: 'draft', limit: 50, organizationId: 'o1' }))
    expect(result.orders[0]).toMatchObject({ refNo: 'PO-1', vendor: 'Acme' })
    expect(action.path).toBe('/erp/purchasing/orders')
  })

  test('get resolves by ref then returns header + items + total', async () => {
    poSvc.list.mockResolvedValue({ orders: [{ id: 'po1', refNo: 'PO-1' }] })
    poSvc.getById.mockResolvedValue({
      id: 'po1', refNo: 'PO-1', status: 'confirmed', vendor: { name: 'Acme' },
      items: [
        { product: { name: 'Widget' }, qty: 2, unitPrice: 5 },
        { description: 'Misc', qty: 1, unitPrice: 3 },
      ],
    })
    const { result, action } = await byName.get_purchase_order.handler({ search: 'PO-1' }, ctx)
    expect(poSvc.getById).toHaveBeenCalledWith('po1', 'o1')
    expect(result.items).toHaveLength(2)
    expect(result.total).toBe(13)
    expect(result.items[0]).toMatchObject({ product: 'Widget', lineTotal: 10 })
    expect(action.path).toBe('/erp/purchasing/orders/po1')
  })

  test('get reports when nothing matches', async () => {
    poSvc.list.mockResolvedValue({ orders: [] })
    const { result } = await byName.get_purchase_order.handler({ search: 'ghost' }, ctx)
    expect(result).toMatch(/No purchase order matches/)
    expect(poSvc.getById).not.toHaveBeenCalled()
  })

  test('get asks to narrow on ambiguous ref', async () => {
    poSvc.list.mockResolvedValue({ orders: [{ id: 'po1', refNo: 'PO-10' }, { id: 'po2', refNo: 'PO-100' }] })
    const { result } = await byName.get_purchase_order.handler({ search: 'PO-1' }, ctx)
    expect(result).toMatch(/Multiple purchase orders match/)
  })
})

describe('purchase requisitions', () => {
  test('list slims rows', async () => {
    prSvc.list.mockResolvedValue({ total: 1, requisitions: [
      { id: 'pr1', refNo: 'PR-1', date: '2026-01-01', status: 'approved', requestedBy: 'Bob', department: 'Ops', vendor: { name: 'Acme' } },
    ] })
    const { result, action } = await byName.list_purchase_requisitions.handler({ search: 'pr' }, ctx)
    expect(prSvc.list).toHaveBeenCalledWith(expect.objectContaining({ search: 'pr', limit: 10, organizationId: 'o1' }))
    expect(result.requisitions[0]).toMatchObject({ refNo: 'PR-1', requestedBy: 'Bob', vendor: 'Acme' })
    expect(action.path).toBe('/erp/purchasing/requisitions')
  })

  test('get resolves and returns items + total', async () => {
    prSvc.list.mockResolvedValue({ requisitions: [{ id: 'pr1', refNo: 'PR-1' }] })
    prSvc.getById.mockResolvedValue({
      id: 'pr1', refNo: 'PR-1', status: 'draft',
      items: [{ product: { name: 'Bolt' }, qty: 10, unitPrice: 0.5 }],
    })
    const { result, action } = await byName.get_purchase_requisition.handler({ search: 'PR-1' }, ctx)
    expect(prSvc.getById).toHaveBeenCalledWith('pr1', 'o1')
    expect(result.total).toBe(5)
    expect(action.path).toBe('/erp/purchasing/requisitions/pr1')
  })
})
