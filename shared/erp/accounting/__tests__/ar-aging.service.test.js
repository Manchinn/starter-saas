jest.mock('../../../../server/models', () => ({
  Invoice:  { findAll: jest.fn() },
  Customer: {},
}))

const { Invoice } = require('../../../../server/models')
const service = require('../services/ar-aging.service')

function mkInv({ id, customerId, customerName, dueDate, total, invoiceNumber = 'INV-1' }) {
  return {
    id, customerId, invoiceNumber, dueDate, total, invoiceDate: '2025-01-01',
    customer: { id: customerId, name: customerName, company: null, email: null, phone: null },
  }
}

describe('ar-aging.getReport', () => {
  test('buckets invoices into current / 1-30 / 31-60 / 61-90 / 91+ relative to asOfDate', async () => {
    Invoice.findAll.mockResolvedValue([
      mkInv({ id: '1', customerId: 'c1', customerName: 'Acme', dueDate: '2025-04-15', total: 100, invoiceNumber: 'A' }), // future = current
      mkInv({ id: '2', customerId: 'c1', customerName: 'Acme', dueDate: '2025-04-01', total: 50,  invoiceNumber: 'B' }), // ~10 days = 1-30
      mkInv({ id: '3', customerId: 'c1', customerName: 'Acme', dueDate: '2025-03-01', total: 30,  invoiceNumber: 'C' }), // ~41 days = 31-60
      mkInv({ id: '4', customerId: 'c2', customerName: 'Beta', dueDate: '2025-01-15', total: 200, invoiceNumber: 'D' }), // ~86 days = 61-90
      mkInv({ id: '5', customerId: 'c2', customerName: 'Beta', dueDate: '2024-09-01', total: 70,  invoiceNumber: 'E' }), // > 90 days = 91+
    ])
    const out = await service.getReport({ asOfDate: '2025-04-11', organizationId: 'o' })
    expect(out.summary.current).toBe(100)
    expect(out.summary.days1_30).toBe(50)
    expect(out.summary.days31_60).toBe(30)
    expect(out.summary.days61_90).toBe(200)
    expect(out.summary.days91plus).toBe(70)
    expect(out.summary.total).toBe(450)
  })

  test('groups by customer and sorts by descending total', async () => {
    Invoice.findAll.mockResolvedValue([
      mkInv({ id: '1', customerId: 'c1', customerName: 'Small', dueDate: '2025-04-15', total: 10, invoiceNumber: 'A' }),
      mkInv({ id: '2', customerId: 'c2', customerName: 'Big',   dueDate: '2025-04-15', total: 500, invoiceNumber: 'B' }),
      mkInv({ id: '3', customerId: 'c3', customerName: 'Mid',   dueDate: '2025-04-15', total: 100, invoiceNumber: 'C' }),
    ])
    const out = await service.getReport({ asOfDate: '2025-04-11' })
    expect(out.customers.map(c => c.customer.name)).toEqual(['Big', 'Mid', 'Small'])
    expect(out.customers[0].summary.total).toBe(500)
  })

  test('only considers sent invoices', async () => {
    Invoice.findAll.mockResolvedValue([])
    await service.getReport({ asOfDate: '2025-04-11', organizationId: 'o' })
    const where = Invoice.findAll.mock.calls[0][0].where
    expect(where.status).toBe('sent')
    expect(where.organizationId).toBe('o')
  })

  test('filters by customerId when provided', async () => {
    Invoice.findAll.mockResolvedValue([])
    await service.getReport({ customerId: 'c1' })
    expect(Invoice.findAll.mock.calls[0][0].where.customerId).toBe('c1')
  })

  test('invoices without a due date land in the current bucket', async () => {
    Invoice.findAll.mockResolvedValue([
      mkInv({ id: '1', customerId: 'c1', customerName: 'X', dueDate: null, total: 42, invoiceNumber: 'A' }),
    ])
    const out = await service.getReport({ asOfDate: '2025-04-11' })
    expect(out.summary.current).toBe(42)
    expect(out.summary.total).toBe(42)
    expect(out.customers[0].invoices[0].daysOverdue).toBe(0)
  })

  test('totals are rounded to 2 decimals', async () => {
    Invoice.findAll.mockResolvedValue([
      mkInv({ id: '1', customerId: 'c1', customerName: 'X', dueDate: '2025-04-15', total: 10.005, invoiceNumber: 'A' }),
      mkInv({ id: '2', customerId: 'c1', customerName: 'X', dueDate: '2025-04-15', total: 10.005, invoiceNumber: 'B' }),
    ])
    const out = await service.getReport({ asOfDate: '2025-04-11' })
    // 20.01 (not 20.0099999…)
    expect(out.summary.current).toBe(20.01)
  })
})
