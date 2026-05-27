// Unit tests for stock/good-receive.service.
//
// The confirm() flow runs across multiple sequelize models inside a
// transaction (product stock update + storeStock upsert + StockMovement
// create per line); we don't unit-test that body — too brittle. We cover
// validation, guards, the docType branching (invoice vs delivery), and the
// createBill conversion handler.

jest.mock('../../../../../server/models', () => ({
  GoodReceive:     { findAndCountAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  GoodReceiveItem: { destroy: jest.fn(), create: jest.fn() },
  Product:         {},
  Store:           { findByPk: jest.fn() },
  StoreStock:      {},
  StockMovement:   {},
  UOM:             {},
  UOMConversion:   { findOne: jest.fn() },
  VendorBill:      { findOne: jest.fn() },
  PurchaseOrder:   { findByPk: jest.fn() },
}))

jest.mock('../../../../../server/config/database', () => ({ transaction: jest.fn() }))

jest.mock('../../../audit/audit.service', () => ({ log: jest.fn() }))
jest.mock('../../../settings/services/sequence.service', () => ({ getNext: jest.fn(() => 'GR-1') }), { virtual: true })
jest.mock('../../stock-count/stock-count.service', () => ({ checkStoreLock: jest.fn() }), { virtual: true })
jest.mock('../../../accounting/services/vendor-bill.service', () => ({ create: jest.fn() }), { virtual: true })

const { Op } = require('sequelize')
const { GoodReceive, Store, VendorBill, PurchaseOrder } = require('../../../../../server/models')
const sequelize = require('../../../../../server/config/database')
const billSvc = require('../../../accounting/services/vendor-bill.service')
const service = require('../good-receive.service')

beforeEach(() => {
  // resetMocks: true clears impl; re-bind a transaction returning commit/rollback
  // (good-receive uses await sequelize.transaction() then explicit commit/rollback).
  sequelize.transaction.mockImplementation(async () => ({
    commit:   jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
  }))
})

describe('good-receive.list', () => {
  beforeEach(() => {
    GoodReceive.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
  })

  test('paginates, org+soft-delete scoping, distinct: true', async () => {
    GoodReceive.findAndCountAll.mockResolvedValueOnce({ count: 3, rows: [{ id: 'gr1' }] })
    const out = await service.list({ page: 2, limit: 2, organizationId: 'o' })
    expect(out).toEqual({ total: 3, page: 2, limit: 2, goodReceives: [{ id: 'gr1' }] })
    const args = GoodReceive.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(2)
    expect(args.where.organizationId).toBe('o')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.distinct).toBe(true)
  })

  test('search filters across refNo and supplier', async () => {
    await service.list({ search: 'AlphaCo', organizationId: 'o' })
    const or = GoodReceive.findAndCountAll.mock.calls[0][0].where[Op.or]
    expect(or[0].refNo[Op.like]).toBe('%AlphaCo%')
    expect(or[1].supplier[Op.like]).toBe('%AlphaCo%')
  })
})

describe('good-receive.getById', () => {
  test('throws 404 when missing', async () => {
    GoodReceive.findByPk.mockResolvedValue(null)
    await expect(service.getById('missing')).rejects.toEqual({ status: 404, message: 'Good Receive not found' })
  })

  test('joins linkedBill + sourcePO (when purchaseOrderId set)', async () => {
    const gr = { id: 'gr1', purchaseOrderId: 'po-1', toJSON() { return { id: 'gr1', purchaseOrderId: 'po-1' } } }
    GoodReceive.findByPk.mockResolvedValue(gr)
    VendorBill.findOne.mockResolvedValue({ id: 'b1', billNumber: 'BILL-1', status: 'draft' })
    PurchaseOrder.findByPk.mockResolvedValue({ id: 'po-1', refNo: 'PO-1' })
    const out = await service.getById('gr1')
    expect(out.linkedBill).toEqual({ id: 'b1', billNumber: 'BILL-1', status: 'draft' })
    expect(out.purchaseOrder).toEqual({ id: 'po-1', refNo: 'PO-1' })
  })

  test('skips PO lookup when no purchaseOrderId', async () => {
    GoodReceive.findByPk.mockResolvedValue({ id: 'gr1', purchaseOrderId: null, toJSON() { return { id: 'gr1' } } })
    VendorBill.findOne.mockResolvedValue(null)
    const out = await service.getById('gr1')
    expect(PurchaseOrder.findByPk).not.toHaveBeenCalled()
    expect(out.purchaseOrder).toBeNull()
    expect(out.linkedBill).toBeNull()
  })
})

describe('good-receive.create — validation', () => {
  test('rejects missing date / store / empty items', async () => {
    await expect(service.create({ storeId: 's', items: [{ productId: 'p', qty: 1 }] }))
      .rejects.toEqual({ status: 400, message: 'Date is required' })
    await expect(service.create({ date: '2025-01-01', items: [{ productId: 'p', qty: 1 }] }))
      .rejects.toEqual({ status: 400, message: 'Store is required' })
    await expect(service.create({ date: '2025-01-01', storeId: 's' }))
      .rejects.toEqual({ status: 400, message: 'At least one item is required' })
  })

  test('docType "invoice" requires invoiceNo', async () => {
    await expect(service.create({
      date: '2025-01-01', storeId: 's', docType: 'invoice',
      items: [{ productId: 'p', qty: 1 }],
    })).rejects.toEqual({ status: 400, message: 'Invoice Number is required' })
  })

  test('docType "delivery" requires deliveryNo', async () => {
    await expect(service.create({
      date: '2025-01-01', storeId: 's', docType: 'delivery',
      items: [{ productId: 'p', qty: 1 }],
    })).rejects.toEqual({ status: 400, message: 'Delivery Number is required' })
  })

  test('rejects when store does not exist', async () => {
    Store.findByPk.mockResolvedValue(null)
    await expect(service.create({
      date: '2025-01-01', storeId: 'missing', invoiceNo: 'I-1',
      items: [{ productId: 'p', qty: 1 }],
    })).rejects.toEqual({ status: 400, message: 'Store not found' })
  })
})

describe('good-receive.confirm — guards', () => {
  test('throws 404 when missing', async () => {
    GoodReceive.findByPk.mockResolvedValue(null)
    await expect(service.confirm('missing')).rejects.toEqual({ status: 404, message: 'Good Receive not found' })
  })

  test('refuses to confirm an already-confirmed GR', async () => {
    GoodReceive.findByPk.mockResolvedValue({ id: 'gr1', status: 'confirmed', items: [] })
    await expect(service.confirm('gr1'))
      .rejects.toEqual({ status: 400, message: 'Already confirmed' })
  })

  test('refuses when storeId is missing', async () => {
    GoodReceive.findByPk.mockResolvedValue({ id: 'gr1', status: 'draft', storeId: null, items: [] })
    await expect(service.confirm('gr1'))
      .rejects.toEqual({ status: 400, message: 'Store is required before confirming' })
  })
})

describe('good-receive.update — guards', () => {
  test('throws 404 when missing', async () => {
    GoodReceive.findByPk.mockResolvedValue(null)
    await expect(service.update('missing', { date: '2025-01-01', storeId: 's', items: [{ productId: 'p', qty: 1 }] }, 'u'))
      .rejects.toEqual({ status: 404, message: 'Good Receive not found' })
  })

  test('refuses to edit a confirmed GR', async () => {
    GoodReceive.findByPk.mockResolvedValue({ id: 'gr1', status: 'confirmed' })
    await expect(service.update('gr1', { date: '2025-01-01', storeId: 's', items: [{ productId: 'p', qty: 1 }] }, 'u'))
      .rejects.toEqual({ status: 400, message: 'Cannot edit a confirmed Good Receive' })
  })

  test('docType falls back to the existing record when omitted; invoiceNo still required for invoice', async () => {
    GoodReceive.findByPk.mockResolvedValue({ id: 'gr1', status: 'draft', docType: 'invoice' })
    await expect(service.update('gr1', {
      date: '2025-01-01', storeId: 's',
      // docType omitted → stays 'invoice' → invoiceNo required
      items: [{ productId: 'p', qty: 1 }],
    }, 'u')).rejects.toEqual({ status: 400, message: 'Invoice Number is required' })
  })
})

describe('good-receive.remove', () => {
  test('throws 404 when missing', async () => {
    GoodReceive.findByPk.mockResolvedValue(null)
    await expect(service.remove('missing')).rejects.toEqual({ status: 404, message: 'Good Receive not found' })
  })

  test('refuses to delete a confirmed GR', async () => {
    GoodReceive.findByPk.mockResolvedValue({ id: 'gr1', status: 'confirmed' })
    await expect(service.remove('gr1'))
      .rejects.toEqual({ status: 400, message: 'Cannot delete a confirmed Good Receive' })
  })

  test('destroys a draft', async () => {
    const gr = { id: 'gr1', status: 'draft', destroy: jest.fn().mockResolvedValue() }
    GoodReceive.findByPk.mockResolvedValue(gr)
    await service.remove('gr1')
    expect(gr.destroy).toHaveBeenCalled()
  })
})

describe('good-receive.createBill', () => {
  test('refuses non-confirmed GR', async () => {
    GoodReceive.findByPk.mockResolvedValue({
      id: 'gr1', status: 'draft', purchaseOrderId: null,
      toJSON() { return { id: 'gr1', status: 'draft', items: [], purchaseOrderId: null } },
    })
    VendorBill.findOne.mockResolvedValue(null)
    await expect(service.createBill('gr1', 'u', 'o'))
      .rejects.toEqual({ status: 400, message: 'Only confirmed Good Receives can generate a bill' })
  })

  test('refuses when a bill already exists, naming it', async () => {
    GoodReceive.findByPk.mockResolvedValue({
      id: 'gr1', status: 'confirmed', purchaseOrderId: null,
      toJSON() { return { id: 'gr1', status: 'confirmed', items: [], purchaseOrderId: null } },
    })
    // First call: getById join. Second: existence guard.
    VendorBill.findOne
      .mockResolvedValueOnce({ id: 'b1', billNumber: 'BILL-9' })
      .mockResolvedValueOnce({ id: 'b1', billNumber: 'BILL-9' })
    await expect(service.createBill('gr1', 'u', 'o'))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('BILL-9 already exists') })
    expect(billSvc.create).not.toHaveBeenCalled()
  })

  test('happy path: pulls vendor from linked PO + forwards items to vendor-bill.create', async () => {
    const gr = {
      id: 'gr1', status: 'confirmed', refNo: 'GR-1', invoiceNo: 'INV-X',
      purchaseOrderId: 'po-1',
      items: [
        { productId: 'p1', qty: '3', cost: '10', product: { name: 'A' } },
        { productId: 'p2', qty: '2', cost: '5',  product: { name: 'B' } },
      ],
      toJSON() {
        return {
          id: 'gr1', status: 'confirmed', refNo: 'GR-1', invoiceNo: 'INV-X',
          purchaseOrderId: 'po-1', items: this.items,
        }
      },
    }
    GoodReceive.findByPk.mockResolvedValue(gr)
    VendorBill.findOne.mockResolvedValue(null)
    PurchaseOrder.findByPk.mockResolvedValue({ id: 'po-1', vendorId: 'v-1', refNo: 'PO-1' })
    billSvc.create.mockResolvedValue({ id: 'bill-new' })

    const out = await service.createBill('gr1', 'u', 'org')
    expect(out).toEqual({ id: 'bill-new' })
    const payload = billSvc.create.mock.calls[0][0]
    expect(payload.vendorId).toBe('v-1')
    expect(payload.purchaseOrderId).toBe('po-1')
    expect(payload.goodReceiveId).toBe('gr1')
    expect(payload.vendorInvoiceNo).toBe('INV-X')
    expect(payload.items).toEqual([
      { productId: 'p1', description: 'A', quantity: 3, unitPrice: 10 },
      { productId: 'p2', description: 'B', quantity: 2, unitPrice: 5  },
    ])
  })

  test('vendor is null when GR has no linked PO', async () => {
    GoodReceive.findByPk.mockResolvedValue({
      id: 'gr1', status: 'confirmed', refNo: 'GR-1', purchaseOrderId: null, invoiceNo: null,
      items: [{ productId: 'p1', qty: 1, cost: 1, product: null }],
      toJSON() { return { id: 'gr1', status: 'confirmed', refNo: 'GR-1', purchaseOrderId: null, invoiceNo: null, items: this.items } },
    })
    VendorBill.findOne.mockResolvedValue(null)
    billSvc.create.mockResolvedValue({ id: 'bill-new' })
    await service.createBill('gr1', 'u', 'org')
    const payload = billSvc.create.mock.calls[0][0]
    expect(payload.vendorId).toBeNull()
    expect(PurchaseOrder.findByPk).not.toHaveBeenCalled()
    // description falls back to 'Item' when product is null
    expect(payload.items[0].description).toBe('Item')
  })
})
