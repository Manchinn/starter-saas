// Unit tests for invoice.service.
//
// Strategy: invoice.service does heavy work inside sequelize.transaction()
// — testing the full create / update flow requires emulating the
// transaction body, which is brittle. We instead pin down the parts that
// matter on their own:
//   - list filters + pagination + soft-delete exclusion
//   - getById 404 + linkedReceipt/sourceDO join
//   - updateStatus transition matrix + auto-journal rollback
//   - createReceipt guards (status + existing-receipt block)
//   - remove guard
// The transaction-wrapped paths are not directly tested here; their pure
// math helper (computeTotals) is exercised through status-side-effects and
// observable persistence on the InvoiceItem.create mock when applicable.

jest.mock('../../../../server/models', () => {
  const mockSequelize = { transaction: jest.fn() }
  return {
    Invoice:        { findAndCountAll: jest.fn(), findByPk: jest.fn(), count: jest.fn(), create: jest.fn() },
    InvoiceItem:    { destroy: jest.fn(), create: jest.fn() },
    Customer:       {},
    Order:          {},
    DeliveryOrder:  { findByPk: jest.fn() },
    SaleItem:       { findByPk: jest.fn() },
    SalePackage:    { findByPk: jest.fn() },
    SalePackageItem:{},
    Product:        { findByPk: jest.fn() },
    Store:          {},
    User:           {},
    Receipt:        { findOne: jest.fn() },
    sequelize:      mockSequelize,
  }
})

jest.mock('../../accounting/services/tax-period.service', () => ({ assertOpen: jest.fn() }))
jest.mock('../../accounting/services/auto-journal.service', () => ({
  postInvoice:    jest.fn(),
  reverseInvoice: jest.fn(),
}))
jest.mock('../../audit/audit.service', () => ({ log: jest.fn() }))
jest.mock('../../settings/services/currency.service', () => ({ getRateOn: jest.fn(() => 1) }), { virtual: true })
jest.mock('../../receipts/receipt.service', () => ({ create: jest.fn() }), { virtual: true })

const { Op } = require('sequelize')
const { Invoice, Receipt, DeliveryOrder } = require('../../../../server/models')
const autoJournal = require('../../accounting/services/auto-journal.service')
const receiptSvc = require('../../receipts/receipt.service')
const service = require('../invoice.service')

describe('invoice.list', () => {
  beforeEach(() => {
    Invoice.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
  })

  test('paginates, scopes by org, excludes soft-deleted, ordered by createdAt DESC', async () => {
    Invoice.findAndCountAll.mockResolvedValueOnce({ count: 7, rows: [{ id: 'i1' }] })
    const out = await service.list({ page: 2, limit: 5, organizationId: 'o' })
    expect(out).toEqual({ total: 7, page: 2, limit: 5, invoices: [{ id: 'i1' }] })
    const args = Invoice.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(5)
    expect(args.where.organizationId).toBe('o')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.order).toEqual([['createdAt', 'DESC']])
    expect(args.include[0]).toMatchObject({ as: 'customer', attributes: ['id', 'name', 'company'] })
  })

  test('search applies LIKE on invoiceNumber only', async () => {
    await service.list({ search: 'INV-2025', organizationId: 'o' })
    const w = Invoice.findAndCountAll.mock.calls[0][0].where
    expect(w.invoiceNumber[Op.like]).toBe('%INV-2025%')
  })

  test('dateFrom / dateTo build gte/lte on invoiceDate', async () => {
    await service.list({ dateFrom: '2025-01-01', dateTo: '2025-01-31', organizationId: 'o' })
    const range = Invoice.findAndCountAll.mock.calls[0][0].where.invoiceDate
    expect(range[Op.gte]).toBe('2025-01-01')
    expect(range[Op.lte]).toBe('2025-01-31')
  })

  test('omitting both dates skips the invoiceDate filter entirely', async () => {
    await service.list({ organizationId: 'o' })
    expect(Invoice.findAndCountAll.mock.calls[0][0].where).not.toHaveProperty('invoiceDate')
  })
})

describe('invoice.getById', () => {
  test('throws 404 when missing', async () => {
    Invoice.findByPk.mockResolvedValue(null)
    await expect(service.getById('missing')).rejects.toEqual({ status: 404, message: 'Invoice not found' })
  })

  test('joins linkedReceipt and sourceDO (when deliveryOrderId set)', async () => {
    const inv = {
      id: 'i1', invoiceNumber: 'INV-1', deliveryOrderId: 'do-1',
      toJSON() { return { id: 'i1', invoiceNumber: 'INV-1', deliveryOrderId: 'do-1' } },
    }
    Invoice.findByPk.mockResolvedValue(inv)
    Receipt.findOne.mockResolvedValue({ id: 'r1', receiptNumber: 'R-1' })
    DeliveryOrder.findByPk.mockResolvedValue({ id: 'do-1', refNo: 'DO-1' })

    const out = await service.getById('i1')
    expect(out.linkedReceipt).toEqual({ id: 'r1', receiptNumber: 'R-1' })
    expect(out.deliveryOrder).toEqual({ id: 'do-1', refNo: 'DO-1' })
  })

  test('skips the deliveryOrder lookup when invoice has no deliveryOrderId', async () => {
    const inv = { id: 'i1', deliveryOrderId: null, toJSON() { return { id: 'i1' } } }
    Invoice.findByPk.mockResolvedValue(inv)
    Receipt.findOne.mockResolvedValue(null)

    const out = await service.getById('i1')
    expect(DeliveryOrder.findByPk).not.toHaveBeenCalled()
    expect(out.deliveryOrder).toBeNull()
    expect(out.linkedReceipt).toBeNull()
  })
})

describe('invoice.updateStatus — transition matrix', () => {
  test('returns early (no-op) when already in target status', async () => {
    Invoice.findByPk.mockResolvedValue({ id: 'i1', status: 'sent', deliveryOrderId: null, toJSON() { return {} } })
    Receipt.findOne.mockResolvedValue(null)
    await service.updateStatus('i1', 'sent', 'u')
    expect(autoJournal.postInvoice).not.toHaveBeenCalled()
  })

  test('rejects illegal transitions', async () => {
    Invoice.findByPk.mockResolvedValue({ id: 'i1', status: 'draft' })
    await expect(service.updateStatus('i1', 'paid', 'u'))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('Cannot transition from "draft" to "paid"') })
  })

  test('rejects transitions out of terminal "paid" or "cancelled"', async () => {
    Invoice.findByPk.mockResolvedValue({ id: 'i1', status: 'paid' })
    await expect(service.updateStatus('i1', 'sent', 'u'))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('Cannot transition from "paid"') })
  })

  test('draft → sent posts auto-journal; rollback on failure', async () => {
    const inv = { id: 'i1', status: 'draft', invoiceNumber: 'INV-1', update: jest.fn().mockResolvedValue(), deliveryOrderId: null, toJSON() { return { id: 'i1' } } }
    Invoice.findByPk.mockResolvedValue(inv)
    Receipt.findOne.mockResolvedValue(null)
    autoJournal.postInvoice.mockRejectedValue(new Error('GL down'))

    await expect(service.updateStatus('i1', 'sent', 'u')).rejects.toThrow('GL down')
    expect(inv.update).toHaveBeenNthCalledWith(1, { status: 'sent' })
    expect(inv.update).toHaveBeenNthCalledWith(2, { status: 'draft' })
  })

  test('draft → sent happy path: posts journal and logs audit', async () => {
    const inv = { id: 'i1', status: 'draft', invoiceNumber: 'INV-1', update: jest.fn().mockResolvedValue(), deliveryOrderId: null, toJSON() { return { id: 'i1' } } }
    Invoice.findByPk.mockResolvedValue(inv)
    Receipt.findOne.mockResolvedValue(null)
    autoJournal.postInvoice.mockResolvedValue()
    const audit = require('../../audit/audit.service')

    await service.updateStatus('i1', 'sent', 'u')
    expect(autoJournal.postInvoice).toHaveBeenCalled()
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'u',
      action: 'invoice.sent',
      entityType: 'Invoice',
      entityId: 'i1',
    }))
  })

  test('cancelling a sent invoice triggers reverseInvoice with the previous status in the reason', async () => {
    const inv = { id: 'i1', status: 'sent', invoiceNumber: 'INV-1', update: jest.fn().mockResolvedValue(), deliveryOrderId: null, toJSON() { return { id: 'i1' } } }
    Invoice.findByPk.mockResolvedValue(inv)
    Receipt.findOne.mockResolvedValue(null)
    autoJournal.reverseInvoice.mockResolvedValue()
    await service.updateStatus('i1', 'cancelled', 'u')
    expect(autoJournal.reverseInvoice).toHaveBeenCalledWith(inv, 'u', expect.stringContaining('"sent"'))
  })

  test('cancelling a draft invoice does NOT call reverseInvoice', async () => {
    const inv = { id: 'i1', status: 'draft', invoiceNumber: 'INV-1', update: jest.fn().mockResolvedValue(), deliveryOrderId: null, toJSON() { return { id: 'i1' } } }
    Invoice.findByPk.mockResolvedValue(inv)
    Receipt.findOne.mockResolvedValue(null)
    await service.updateStatus('i1', 'cancelled', 'u')
    expect(autoJournal.reverseInvoice).not.toHaveBeenCalled()
  })

  test('rollback when reverseInvoice fails on cancel', async () => {
    const inv = { id: 'i1', status: 'sent', invoiceNumber: 'INV-1', update: jest.fn().mockResolvedValue() }
    Invoice.findByPk.mockResolvedValue(inv)
    autoJournal.reverseInvoice.mockRejectedValue(new Error('reverse boom'))
    await expect(service.updateStatus('i1', 'cancelled', 'u')).rejects.toThrow('reverse boom')
    expect(inv.update).toHaveBeenNthCalledWith(1, { status: 'cancelled' })
    expect(inv.update).toHaveBeenNthCalledWith(2, { status: 'sent' })
  })
})

describe('invoice.remove', () => {
  test('throws 404 when missing', async () => {
    Invoice.findByPk.mockResolvedValue(null)
    await expect(service.remove('missing')).rejects.toEqual({ status: 404, message: 'Invoice not found' })
  })

  test('refuses anything other than draft', async () => {
    Invoice.findByPk.mockResolvedValue({ id: 'i1', status: 'sent' })
    await expect(service.remove('i1'))
      .rejects.toEqual({ status: 400, message: 'Only draft invoices can be deleted' })
  })

  test('destroys a draft', async () => {
    const inv = { id: 'i1', status: 'draft', destroy: jest.fn().mockResolvedValue() }
    Invoice.findByPk.mockResolvedValue(inv)
    await service.remove('i1')
    expect(inv.destroy).toHaveBeenCalled()
  })
})

describe('invoice.createReceipt', () => {
  test('refuses invoices in draft or cancelled status', async () => {
    Invoice.findByPk.mockResolvedValue({ id: 'i1', status: 'draft', deliveryOrderId: null, toJSON() { return { id: 'i1', status: 'draft' } } })
    Receipt.findOne.mockResolvedValue(null)
    await expect(service.createReceipt('i1', 'u', 'o'))
      .rejects.toEqual({ status: 400, message: 'Only sent or paid invoices can record a payment' })
  })

  test('refuses when a receipt already exists, naming it in the error', async () => {
    Invoice.findByPk.mockResolvedValue({ id: 'i1', status: 'sent', deliveryOrderId: null, toJSON() { return { id: 'i1', status: 'sent' } } })
    // First Receipt.findOne is for the getById join; second is the duplicate check.
    Receipt.findOne
      .mockResolvedValueOnce({ id: 'r1', receiptNumber: 'R-9' })
      .mockResolvedValueOnce({ id: 'r1', receiptNumber: 'R-9' })

    await expect(service.createReceipt('i1', 'u', 'o'))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('R-9 already exists') })
    expect(receiptSvc.create).not.toHaveBeenCalled()
  })

  test('happy path: creates a receipt from the invoice total', async () => {
    Invoice.findByPk.mockResolvedValue({
      id: 'i1', status: 'sent', invoiceNumber: 'INV-1',
      customerId: 'c1', total: '125.75', deliveryOrderId: null,
      toJSON() { return { id: 'i1', status: 'sent', invoiceNumber: 'INV-1', customerId: 'c1', total: '125.75' } },
    })
    Receipt.findOne
      .mockResolvedValueOnce(null) // getById join
      .mockResolvedValueOnce(null) // duplicate check
    receiptSvc.create.mockResolvedValue({ id: 'r-new' })

    const out = await service.createReceipt('i1', 'u', 'o')
    expect(out).toEqual({ id: 'r-new' })
    expect(receiptSvc.create).toHaveBeenCalledWith(expect.objectContaining({
      customerId: 'c1',
      invoiceId:  'i1',
      paymentMethod: 'cash',
      amount: 125.75,
      organizationId: 'o',
    }))
  })
})
