// Unit tests for the Receipts AI tool handlers (read-only lookups). The
// handlers lazily `require` the receipt service, so we mock that module path
// and drive each tool's handler directly with a fake user ctx.
jest.mock('../receipt.service', () => ({
  list: jest.fn(), getById: jest.fn(),
}))

const receiptSvc = require('../receipt.service')
const { tools, navTargets } = require('../ai-tools')

const USER = { id: 'u1', organizationId: 'o1' }
const ctx  = { user: USER }
const byName = Object.fromEntries(tools.map((t) => [t.name, t]))

beforeEach(() => jest.clearAllMocks())

describe('receipts ai-tools — registry', () => {
  test('exposes the read-only toolset and nav targets', () => {
    expect(Object.keys(byName).sort()).toEqual(['get_receipt', 'list_receipts'])
    expect(navTargets).toHaveProperty('receipts_list')
    expect(navTargets).toHaveProperty('receipts_create')
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
    expect(names).not.toMatch(/create|update|delete|confirm|cancel|status/)
  })
})

describe('list_receipts', () => {
  test('passes filters, clamps the limit, slims rows', async () => {
    receiptSvc.list.mockResolvedValue({ total: 1, receipts: [
      { id: 'r1', receiptNumber: 'REC-00001', receiptDate: '2026-01-01', status: 'confirmed', customer: { name: 'Acme' }, amount: '120.00', paymentMethod: 'cash', currency: 'USD' },
    ] })
    const { result, action } = await byName.list_receipts.handler({ status: 'confirmed', limit: 999 }, ctx)
    expect(receiptSvc.list).toHaveBeenCalledWith(expect.objectContaining({ status: 'confirmed', limit: 50, organizationId: 'o1' }))
    expect(result.receipts[0]).toMatchObject({ receiptNumber: 'REC-00001', customer: 'Acme', amount: 120, paymentMethod: 'cash' })
    expect(action.path).toBe('/erp/receipts')
  })
})

describe('get_receipt', () => {
  test('resolves by number then returns detail incl. linked invoice', async () => {
    receiptSvc.list.mockResolvedValue({ receipts: [{ id: 'r1', receiptNumber: 'REC-00001' }] })
    receiptSvc.getById.mockResolvedValue({
      id: 'r1', receiptNumber: 'REC-00001', status: 'confirmed', customer: { name: 'Acme' },
      amount: 120, paymentMethod: 'bank_transfer', reference: 'TXN-9', notes: 'thanks',
      invoice: { invoiceNumber: 'INV-7' },
    })
    const { result, action } = await byName.get_receipt.handler({ search: 'REC-00001' }, ctx)
    expect(receiptSvc.getById).toHaveBeenCalledWith('r1', 'o1')
    expect(result).toMatchObject({ id: 'r1', invoice: 'INV-7', reference: 'TXN-9', amount: 120 })
    expect(action.path).toBe('/erp/receipts/r1')
  })

  test('reports when nothing matches', async () => {
    receiptSvc.list.mockResolvedValue({ receipts: [] })
    const { result } = await byName.get_receipt.handler({ search: 'ghost' }, ctx)
    expect(result).toMatch(/No receipt matches/)
    expect(receiptSvc.getById).not.toHaveBeenCalled()
  })

  test('asks to narrow on ambiguous number', async () => {
    receiptSvc.list.mockResolvedValue({ receipts: [{ id: 'r1', receiptNumber: 'REC-10' }, { id: 'r2', receiptNumber: 'REC-100' }] })
    const { result } = await byName.get_receipt.handler({ search: 'REC-1' }, ctx)
    expect(result).toMatch(/Multiple receipts match/)
  })
})
