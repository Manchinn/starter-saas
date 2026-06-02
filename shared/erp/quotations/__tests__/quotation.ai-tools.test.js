// Unit tests for the Quotations AI tool handlers (read-only lookups). The
// handlers lazily `require` the quotation service, so we mock that module path
// and drive each tool's handler directly with a fake user ctx.
jest.mock('../quotation.service', () => ({
  list: jest.fn(), getById: jest.fn(),
}))

const quotationSvc = require('../quotation.service')
const { tools, navTargets } = require('../ai-tools')

const USER = { id: 'u1', organizationId: 'o1' }
const ctx  = { user: USER }
const byName = Object.fromEntries(tools.map((t) => [t.name, t]))

beforeEach(() => jest.clearAllMocks())

describe('quotations ai-tools — registry', () => {
  test('exposes the read-only toolset and nav targets', () => {
    expect(Object.keys(byName).sort()).toEqual(['get_quotation', 'list_quotations'])
    expect(navTargets).toHaveProperty('quotations_list')
    expect(navTargets).toHaveProperty('quotations_create')
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
    expect(names).not.toMatch(/create|update|delete|status|convert|accept|reject|send/)
  })
})

describe('list_quotations', () => {
  test('passes filters, clamps the limit, slims rows', async () => {
    quotationSvc.list.mockResolvedValue({ total: 1, quotations: [
      { id: 'q1', refNo: 'QT-1', quotationDate: '2026-01-01', status: 'sent', customer: { name: 'Acme' }, total: '120.00', currency: 'USD' },
    ] })
    const { result, action } = await byName.list_quotations.handler({ status: 'sent', dateFrom: '2026-01-01', limit: 999 }, ctx)
    expect(quotationSvc.list).toHaveBeenCalledWith(expect.objectContaining({
      status: 'sent', dateFrom: '2026-01-01', limit: 50, organizationId: 'o1',
    }))
    expect(result.quotations[0]).toMatchObject({ refNo: 'QT-1', customer: 'Acme', total: 120 })
    expect(action.path).toBe('/erp/quotations')
  })
})

describe('get_quotation', () => {
  test('resolves by ref then returns header + items', async () => {
    quotationSvc.list.mockResolvedValue({ quotations: [{ id: 'q1', refNo: 'QT-1' }] })
    quotationSvc.getById.mockResolvedValue({
      id: 'q1', refNo: 'QT-1', status: 'accepted', customer: { name: 'Acme' }, total: 120,
      subtotal: 100, tax: 20, salesperson: { name: 'Sam' },
      items: [
        { product: { name: 'Widget' }, quantity: 2, unitPrice: 50, total: 100 },
        { productName: 'Service', quantity: 1, unitPrice: 20, total: 20 },
      ],
    })
    const { result, action } = await byName.get_quotation.handler({ search: 'QT-1' }, ctx)
    expect(quotationSvc.getById).toHaveBeenCalledWith('q1', 'o1')
    expect(result).toMatchObject({ id: 'q1', salesperson: 'Sam', subtotal: 100, tax: 20 })
    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toMatchObject({ product: 'Widget', qty: 2, total: 100 })
    expect(action.path).toBe('/erp/quotations/q1')
  })

  test('reports when nothing matches', async () => {
    quotationSvc.list.mockResolvedValue({ quotations: [] })
    const { result } = await byName.get_quotation.handler({ search: 'ghost' }, ctx)
    expect(result).toMatch(/No quotation matches/)
    expect(quotationSvc.getById).not.toHaveBeenCalled()
  })

  test('asks to narrow on ambiguous ref', async () => {
    quotationSvc.list.mockResolvedValue({ quotations: [{ id: 'q1', refNo: 'QT-10' }, { id: 'q2', refNo: 'QT-100' }] })
    const { result } = await byName.get_quotation.handler({ search: 'QT-1' }, ctx)
    expect(result).toMatch(/Multiple quotations match/)
  })
})
