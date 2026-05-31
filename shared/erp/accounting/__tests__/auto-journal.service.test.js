// auto-journal: focus on idempotency (returns existing journal instead of
// duplicating), FX translation math, and reversal logic. The full posting
// path runs inside sequelize.transaction() so we stub that to passthrough.

jest.mock('../../../../server/config/database', () => ({
  transaction: jest.fn(),
}))

jest.mock('../../../../server/models', () => ({
  Journal:     { findOne: jest.fn(), create: jest.fn() },
  JournalLine: { create: jest.fn() },
  InvoiceItem: { findAll: jest.fn() },
  SaleItem:    { findAll: jest.fn() },
  Product:     { findByPk: jest.fn(), findAll: jest.fn() },
}))

jest.mock('../services/account-mapping.service', () => ({
  getByRole:                 jest.fn(),
  accountForPaymentMethod:   jest.fn(),
}))

jest.mock('../services/tax-period.service', () => ({ assertOpen: jest.fn() }))
jest.mock('../../settings/services/sequence.service', () => ({ getNext: jest.fn(() => 'JE-1') }), { virtual: true })
jest.mock('../../../../server/core/logger', () => ({
  forLabel: () => ({ error: jest.fn() }),
}))

const sequelize = require('../../../../server/config/database')
const { Journal, JournalLine, InvoiceItem, SaleItem, Product } = require('../../../../server/models')
const accounts = require('../services/account-mapping.service')
const service = require('../services/auto-journal.service')

beforeEach(() => {
  // resetMocks: true wipes every mock implementation between tests, so we
  // re-bind the transaction passthrough + account stubs here.
  sequelize.transaction.mockImplementation(async (cb) => cb('tx'))
  accounts.getByRole.mockImplementation(async (role) => ({ id: `acc-${role}`, code: role }))
  accounts.accountForPaymentMethod.mockResolvedValue({ id: 'acc-CASH', code: 'CASH' })
})

describe('auto-journal idempotency', () => {
  test('postInvoice returns the existing journal when one is already posted', async () => {
    Journal.findOne.mockResolvedValue({ id: 'existing-je' })
    const out = await service.postInvoice(
      { id: 'inv', invoiceNumber: 'INV-1', total: 100, subtotal: 100, tax: 0, exchangeRate: 1 },
      'u',
    )
    expect(out).toEqual({ id: 'existing-je' })
    expect(Journal.create).not.toHaveBeenCalled()
  })

  test('postVendorBill is idempotent on the (sourceType, sourceId) pair', async () => {
    Journal.findOne.mockResolvedValue({ id: 'existing-bill-je' })
    const out = await service.postVendorBill({ id: 'b', billNumber: 'B-1', total: 100, exchangeRate: 1 }, 'u')
    expect(out).toEqual({ id: 'existing-bill-je' })
    const where = Journal.findOne.mock.calls[0][0].where
    expect(where.sourceType).toBe('VendorBill')
    expect(where.sourceId).toBe('b')
  })
})

describe('auto-journal posting math', () => {
  test('invoice with tax: AR debit = subtotal + tax (balanced); discount reduces revenue, not AR', async () => {
    Journal.findOne.mockResolvedValue(null)
    Journal.create.mockResolvedValue({ id: 'je-new' })

    await service.postInvoice(
      { id: 'inv', invoiceNumber: 'INV-1', total: 110, subtotal: 100, tax: 10, discountAmount: 0, exchangeRate: 1, invoiceDate: '2025-01-05' },
      'u',
    )
    // 3 lines: AR debit 110, Revenue credit 100, OutputTax credit 10
    const lineCalls = JournalLine.create.mock.calls
    expect(lineCalls).toHaveLength(3)
    expect(lineCalls[0][0]).toMatchObject({ debit: 110, credit: 0 }) // AR
    expect(lineCalls[1][0]).toMatchObject({ debit: 0, credit: 100 }) // Revenue
    expect(lineCalls[2][0]).toMatchObject({ debit: 0, credit: 10 })  // OutputTax
  })

  test('invoice with no tax: revenue absorbs the full total', async () => {
    Journal.findOne.mockResolvedValue(null)
    Journal.create.mockResolvedValue({ id: 'je' })
    await service.postInvoice(
      { id: 'inv', invoiceNumber: 'INV-1', total: 50, subtotal: 50, tax: 0, exchangeRate: 1, invoiceDate: '2025-01-05' },
      'u',
    )
    const lineCalls = JournalLine.create.mock.calls
    expect(lineCalls).toHaveLength(2)
    expect(lineCalls[0][0]).toMatchObject({ debit: 50, credit: 0 }) // AR
    expect(lineCalls[1][0]).toMatchObject({ debit: 0, credit: 50 }) // Revenue
  })

  test('FX translation: doc-currency amounts get translated to base via exchangeRate', async () => {
    Journal.findOne.mockResolvedValue(null)
    Journal.create.mockResolvedValue({ id: 'je' })
    // USD 100 @ 35 → THB 3500
    await service.postInvoice(
      { id: 'inv', invoiceNumber: 'INV-X', total: 100, subtotal: 100, tax: 0, exchangeRate: 35, currency: 'USD', invoiceDate: '2025-01-05' },
      'u',
    )
    const lineCalls = JournalLine.create.mock.calls
    expect(lineCalls[0][0].debit).toBe(3500)
    expect(lineCalls[1][0].credit).toBe(3500)
  })

  test('zero-total invoice is rejected', async () => {
    Journal.findOne.mockResolvedValue(null)
    await expect(service.postInvoice(
      { id: 'inv', invoiceNumber: 'INV-Z', total: 0, subtotal: 0, tax: 0, exchangeRate: 1 },
      'u',
    )).rejects.toMatchObject({ status: 400, message: expect.stringContaining('total is zero') })
  })

  test('postReceipt routes through accountForPaymentMethod', async () => {
    Journal.findOne.mockResolvedValue(null)
    Journal.create.mockResolvedValue({ id: 'je' })
    await service.postReceipt(
      { id: 'r', receiptNumber: 'R-1', amount: 50, exchangeRate: 1, paymentMethod: 'bank_transfer', receiptDate: '2025-01-05' },
      'u',
    )
    expect(accounts.accountForPaymentMethod).toHaveBeenCalledWith('bank_transfer', null)
  })
})

describe('auto-journal: cost of sales (COGS)', () => {
  test('postInvoiceCOGS books Dr COGS / Cr Inventory at Σ(qty × product.cost), resolving via sale item', async () => {
    Journal.findOne.mockResolvedValue(null)
    Journal.create.mockResolvedValue({ id: 'je-cogs' })
    InvoiceItem.findAll.mockResolvedValue([
      { quantity: 2, productId: 'p1', saleItemId: null },  // direct product → 2×10 = 20
      { quantity: 3, productId: null, saleItemId: 'si9' }, // via sale item → product p2 → 3×5 = 15
      { quantity: 1, productId: null, saleItemId: null },  // service line — ignored
    ])
    SaleItem.findAll.mockResolvedValue([{ id: 'si9', productId: 'p2' }])
    Product.findAll.mockResolvedValue([{ id: 'p1', cost: 10 }, { id: 'p2', cost: 5 }])

    await service.postInvoiceCOGS({ id: 'inv', invoiceNumber: 'INV-1', invoiceDate: '2026-01-05' }, 'u')
    const lineCalls = JournalLine.create.mock.calls
    expect(lineCalls).toHaveLength(2)
    expect(lineCalls[0][0]).toMatchObject({ accountId: 'acc-COGS',      debit: 35, credit: 0 })
    expect(lineCalls[1][0]).toMatchObject({ accountId: 'acc-INVENTORY', debit: 0,  credit: 35 })
  })

  test('postInvoiceCOGS returns null (no journal) when total cost is zero', async () => {
    Journal.findOne.mockResolvedValue(null)
    InvoiceItem.findAll.mockResolvedValue([{ quantity: 1, productId: null, saleItemId: null }])
    SaleItem.findAll.mockResolvedValue([])
    Product.findAll.mockResolvedValue([])
    const out = await service.postInvoiceCOGS({ id: 'inv', invoiceNumber: 'INV-1' }, 'u')
    expect(out).toBeNull()
    expect(Journal.create).not.toHaveBeenCalled()
  })

  test('postInvoiceCOGS is idempotent on (Invoice.cogs, id)', async () => {
    Journal.findOne.mockResolvedValue({ id: 'existing-cogs' })
    const out = await service.postInvoiceCOGS({ id: 'inv', invoiceNumber: 'INV-1' }, 'u')
    expect(out).toEqual({ id: 'existing-cogs' })
    expect(Journal.findOne.mock.calls[0][0].where.sourceType).toBe('Invoice.cogs')
  })
})

describe('auto-journal: stock adjustments & issues', () => {
  test('stock increase → Dr Inventory / Cr Inventory Adjustment', async () => {
    Journal.findOne.mockResolvedValue(null)
    Journal.create.mockResolvedValue({ id: 'je' })
    Product.findByPk.mockResolvedValue({ id: 'p', cost: 4 })
    await service.postStockAdjustment({ id: 'adj1', refNo: 'ADJ-1', date: '2026-02-01', items: [{ productId: 'p', qty: 5 }], organizationId: 'o' })
    const lineCalls = JournalLine.create.mock.calls
    expect(lineCalls[0][0]).toMatchObject({ accountId: 'acc-INVENTORY',            debit: 20, credit: 0 })
    expect(lineCalls[1][0]).toMatchObject({ accountId: 'acc-INVENTORY_ADJUSTMENT', debit: 0,  credit: 20 })
  })

  test('stock decrease → Dr Inventory Adjustment / Cr Inventory', async () => {
    Journal.findOne.mockResolvedValue(null)
    Journal.create.mockResolvedValue({ id: 'je' })
    Product.findByPk.mockResolvedValue({ id: 'p', cost: 4 })
    await service.postStockAdjustment({ id: 'adj2', refNo: 'ADJ-2', date: '2026-02-01', items: [{ productId: 'p', qty: -3 }], organizationId: 'o' })
    const lineCalls = JournalLine.create.mock.calls
    expect(lineCalls[0][0]).toMatchObject({ accountId: 'acc-INVENTORY_ADJUSTMENT', debit: 12, credit: 0 })
    expect(lineCalls[1][0]).toMatchObject({ accountId: 'acc-INVENTORY',            debit: 0,  credit: 12 })
  })

  test('postStockIssue relieves inventory: Dr Inventory Adjustment / Cr Inventory', async () => {
    Journal.findOne.mockResolvedValue(null)
    Journal.create.mockResolvedValue({ id: 'je' })
    Product.findByPk.mockResolvedValue({ id: 'p', cost: 2.5 })
    await service.postStockIssue({ id: 'iss1', refNo: 'ISS-1', date: '2026-02-01', items: [{ productId: 'p', qty: 4 }], organizationId: 'o' })
    const lineCalls = JournalLine.create.mock.calls
    expect(lineCalls[0][0]).toMatchObject({ accountId: 'acc-INVENTORY_ADJUSTMENT', debit: 10, credit: 0 })
    expect(lineCalls[1][0]).toMatchObject({ accountId: 'acc-INVENTORY',            debit: 0,  credit: 10 })
  })

  test('postStockAdjustment with zero net cost delta posts nothing', async () => {
    Journal.findOne.mockResolvedValue(null)
    Product.findByPk.mockResolvedValue({ id: 'p', cost: 0 })
    const out = await service.postStockAdjustment({ id: 'adj3', items: [{ productId: 'p', qty: 5 }], organizationId: 'o' })
    expect(out).toBeNull()
    expect(Journal.create).not.toHaveBeenCalled()
  })
})

describe('auto-journal reversals', () => {
  test('reverseInvoice swaps debits/credits and tags sourceType with .reversal', async () => {
    Journal.findOne
      // first call: locate the original posted journal
      .mockResolvedValueOnce({
        id: 'orig', sourceType: 'Invoice', refNo: 'JE-1', organizationId: 'o',
        lines: [
          { accountId: 'ar',   debit: 110, credit: 0,   description: 'AR' },
          { accountId: 'rev',  debit: 0,   credit: 100, description: 'Rev' },
          { accountId: 'tax',  debit: 0,   credit: 10,  description: 'Tax' },
        ],
      })
      // second call: check if reversal already exists → no
      .mockResolvedValueOnce(null)
    Journal.create.mockResolvedValue({ id: 'rev-je' })

    await service.reverseInvoice({ id: 'inv', invoiceNumber: 'INV-1' }, 'u', 'cancelled')

    expect(Journal.create.mock.calls[0][0].sourceType).toBe('Invoice.reversal')
    const lineCalls = JournalLine.create.mock.calls
    expect(lineCalls).toHaveLength(3)
    // Original AR was debit 110 → reversal credits AR 110
    expect(lineCalls[0][0]).toMatchObject({ debit: 0,   credit: 110 })
    expect(lineCalls[1][0]).toMatchObject({ debit: 100, credit: 0 })
    expect(lineCalls[2][0]).toMatchObject({ debit: 10,  credit: 0 })
  })

  test('reverseInvoice is idempotent — if a reversal exists, returns it without re-posting', async () => {
    Journal.findOne
      .mockResolvedValueOnce({ id: 'orig', lines: [{ accountId: 'a', debit: 1, credit: 0 }, { accountId: 'b', debit: 0, credit: 1 }] })
      .mockResolvedValueOnce({ id: 'rev-existing' })
    const out = await service.reverseInvoice({ id: 'inv' }, 'u')
    expect(out).toEqual({ id: 'rev-existing' })
    expect(Journal.create).not.toHaveBeenCalled()
  })

  test('reverseInvoice returns null when there is no original posted journal', async () => {
    Journal.findOne.mockResolvedValueOnce(null)
    const out = await service.reverseInvoice({ id: 'inv' }, 'u')
    expect(out).toBeNull()
    expect(Journal.create).not.toHaveBeenCalled()
  })
})
