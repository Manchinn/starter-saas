// Unit tests for the Good Receive AI tool handlers (read-only lookups). The
// handlers lazily `require` the good-receive service, so we mock that module
// path and drive each tool's handler directly with a fake user ctx.
jest.mock('../good-receive.service', () => ({
  list: jest.fn(), getById: jest.fn(),
}))

const grSvc = require('../good-receive.service')
const { tools, navTargets } = require('../ai-tools')

const USER = { id: 'u1', organizationId: 'o1' }
const ctx  = { user: USER }
const byName = Object.fromEntries(tools.map((t) => [t.name, t]))

beforeEach(() => jest.clearAllMocks())

describe('good-receive ai-tools — registry', () => {
  test('exposes the read-only toolset and nav targets', () => {
    expect(Object.keys(byName).sort()).toEqual(['get_good_receive', 'list_good_receives'])
    expect(navTargets).toHaveProperty('good_receives_list')
    expect(navTargets).toHaveProperty('good_receives_create')
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
    expect(names).not.toMatch(/create|update|delete|confirm|bill/)
  })
})

describe('list_good_receives', () => {
  test('passes filters, clamps the limit, slims rows', async () => {
    grSvc.list.mockResolvedValue({ total: 1, goodReceives: [
      { id: 'g1', refNo: 'GR-1', date: '2026-01-01', status: 'confirmed', supplier: 'Acme', store: { name: 'Main' }, docType: 'invoice' },
    ] })
    const { result, action } = await byName.list_good_receives.handler({ search: 'gr', limit: 999 }, ctx)
    expect(grSvc.list).toHaveBeenCalledWith(expect.objectContaining({ search: 'gr', limit: 50, organizationId: 'o1' }))
    expect(result.goodReceives[0]).toMatchObject({ refNo: 'GR-1', supplier: 'Acme', store: 'Main' })
    expect(action.path).toBe('/erp/good-receive')
  })
})

describe('get_good_receive', () => {
  test('resolves by ref then returns header + items + linked docs', async () => {
    grSvc.list.mockResolvedValue({ goodReceives: [{ id: 'g1', refNo: 'GR-1' }] })
    grSvc.getById.mockResolvedValue({
      id: 'g1', refNo: 'GR-1', status: 'confirmed', supplier: 'Acme', store: { name: 'Main' },
      invoiceNo: 'INV-9', purchaseOrder: { refNo: 'PO-1' }, linkedBill: { billNumber: 'BILL-2' },
      items: [{ product: { name: 'Widget' }, qty: 5, freeQty: 1, cost: 3, netAmount: 15 }],
    })
    const { result, action } = await byName.get_good_receive.handler({ search: 'GR-1' }, ctx)
    expect(grSvc.getById).toHaveBeenCalledWith('g1')
    expect(result).toMatchObject({ invoiceNo: 'INV-9', purchaseOrder: 'PO-1', linkedBill: 'BILL-2' })
    expect(result.items[0]).toMatchObject({ product: 'Widget', qty: 5, freeQty: 1, netAmount: 15 })
    expect(action.path).toBe('/erp/good-receive/g1')
  })

  test('reports when nothing matches', async () => {
    grSvc.list.mockResolvedValue({ goodReceives: [] })
    const { result } = await byName.get_good_receive.handler({ search: 'ghost' }, ctx)
    expect(result).toMatch(/No good receive matches/)
    expect(grSvc.getById).not.toHaveBeenCalled()
  })

  test('asks to narrow on ambiguous ref', async () => {
    grSvc.list.mockResolvedValue({ goodReceives: [{ id: 'g1', refNo: 'GR-10' }, { id: 'g2', refNo: 'GR-100' }] })
    const { result } = await byName.get_good_receive.handler({ search: 'GR-1' }, ctx)
    expect(result).toMatch(/Multiple good receives match/)
  })
})
