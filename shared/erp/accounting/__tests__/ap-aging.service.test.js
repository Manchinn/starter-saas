// Unit tests for ap-aging.service — payables aging by due-date bucket.

jest.mock('../../../../server/models', () => ({
  VendorBill: { findAll: jest.fn() },
  Vendor:     {},
}))

const { VendorBill } = require('../../../../server/models')
const service = require('../services/ap-aging.service')

const vendor = (id, name) => ({ id, name, code: name?.toUpperCase(), email: null, phone: null })

// asOfDate fixed so bucket math is deterministic.
const AS_OF = '2026-06-30'
const bill = (over, fields = {}) => ({
  id: fields.id || Math.random().toString(36).slice(2),
  billNumber: fields.billNumber || 'BILL-1',
  billDate: '2026-01-01',
  // dueDate = AS_OF minus `over` days
  dueDate: new Date(new Date(AS_OF).getTime() - over * 86400000).toISOString().slice(0, 10),
  total: fields.total ?? 100,
  amountPaid: fields.amountPaid ?? 0,
  vendorId: fields.vendorId || 'v1',
  vendor: fields.vendor || vendor('v1', 'Acme'),
})

beforeEach(() => jest.clearAllMocks())

test('queries only approved, non-deleted bills (scoped by org), optional vendor filter', async () => {
  VendorBill.findAll.mockResolvedValue([])
  await service.getReport({ asOfDate: AS_OF, vendorId: 'v9', organizationId: 'org-1' })
  const args = VendorBill.findAll.mock.calls[0][0]
  expect(args.where.status).toBe('approved')
  expect(args.where.organizationId).toBe('org-1')
  expect(args.where.vendorId).toBe('v9')
})

test('buckets bills by days overdue and accumulates summary', async () => {
  VendorBill.findAll.mockResolvedValue([
    bill(-5,  { id: 'b1', total: 100 }),  // not due → current
    bill(10,  { id: 'b2', total: 200 }),  // 1–30
    bill(45,  { id: 'b3', total: 300 }),  // 31–60
    bill(75,  { id: 'b4', total: 400 }),  // 61–90
    bill(120, { id: 'b5', total: 500 }),  // 91+
  ])
  const { summary, vendors } = await service.getReport({ asOfDate: AS_OF, organizationId: 'o' })
  expect(summary.current).toBe(100)
  expect(summary.days1_30).toBe(200)
  expect(summary.days31_60).toBe(300)
  expect(summary.days61_90).toBe(400)
  expect(summary.days91plus).toBe(500)
  expect(summary.total).toBe(1500)
  expect(vendors).toHaveLength(1)
  expect(vendors[0].summary.total).toBe(1500)
})

test('outstanding = total - amountPaid; fully-paid bills are excluded', async () => {
  VendorBill.findAll.mockResolvedValue([
    bill(10, { id: 'b1', total: 100, amountPaid: 40 }),  // 60 outstanding
    bill(10, { id: 'b2', total: 100, amountPaid: 100 }), // 0 → excluded
  ])
  const { summary } = await service.getReport({ asOfDate: AS_OF, organizationId: 'o' })
  expect(summary.days1_30).toBe(60)
  expect(summary.total).toBe(60)
})

test('groups by vendor and sorts vendors by total desc', async () => {
  VendorBill.findAll.mockResolvedValue([
    bill(10, { id: 'b1', total: 100, vendorId: 'v1', vendor: vendor('v1', 'Small') }),
    bill(10, { id: 'b2', total: 900, vendorId: 'v2', vendor: vendor('v2', 'Big') }),
  ])
  const { vendors } = await service.getReport({ asOfDate: AS_OF, organizationId: 'o' })
  expect(vendors.map(v => v.vendor.id)).toEqual(['v2', 'v1'])
})

test('null due date falls into current bucket', async () => {
  VendorBill.findAll.mockResolvedValue([{ ...bill(0, { id: 'b1', total: 50 }), dueDate: null }])
  const { summary } = await service.getReport({ asOfDate: AS_OF, organizationId: 'o' })
  expect(summary.current).toBe(50)
})
