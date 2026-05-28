// Unit tests for purchasing/purchase-order.service.

jest.mock('../../../../server/models', () => ({
  PurchaseOrder:     { findAndCountAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  PurchaseOrderItem: { destroy: jest.fn(), create: jest.fn() },
  Product:           {},
  Vendor:            { findByPk: jest.fn() },
  PurchaseRequisition: {},
  GoodReceive:       { findOne: jest.fn() },
  Store:             { findOne: jest.fn() },
}))

jest.mock('../../../../server/config/database', () => ({ transaction: jest.fn() }))
jest.mock('../../audit/audit.service', () => ({ log: jest.fn() }))
jest.mock('../../settings/services/sequence.service', () => ({ getNext: jest.fn(() => 'PO-1') }), { virtual: true })
jest.mock('../../settings/services/currency.service', () => ({ getRateOn: jest.fn(() => 1) }), { virtual: true })
jest.mock('../../settings/services/approval-threshold.service', () => ({ enforce: jest.fn() }), { virtual: true })
jest.mock('../../stock/good-receive/good-receive.service', () => ({ create: jest.fn() }), { virtual: true })

const { Op } = require('sequelize')
const { PurchaseOrder, GoodReceive, Store } = require('../../../../server/models')
const audit = require('../../audit/audit.service')
const thresholds = require('../../settings/services/approval-threshold.service')
const grSvc = require('../../stock/good-receive/good-receive.service')
const service = require('../services/purchase-order.service')

describe('purchase-order.list', () => {
  beforeEach(() => {
    PurchaseOrder.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
  })

  test('paginates, distinct, org+soft-delete scoping', async () => {
    PurchaseOrder.findAndCountAll.mockResolvedValueOnce({ count: 9, rows: [{ id: 'po1' }] })
    const out = await service.list({ page: 2, limit: 3, organizationId: 'o' })
    expect(out).toEqual({ total: 9, page: 2, limit: 3, orders: [{ id: 'po1' }] })
    const args = PurchaseOrder.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(3)
    expect(args.where.organizationId).toBe('o')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.distinct).toBe(true)
  })

  test('search filters on refNo / notes', async () => {
    await service.list({ search: 'PO-1', organizationId: 'o' })
    const or = PurchaseOrder.findAndCountAll.mock.calls[0][0].where[Op.or]
    expect(or.map(c => Object.keys(c)[0]).sort()).toEqual(['notes', 'refNo'])
  })
})

describe('purchase-order.getById', () => {
  test('throws 404 when missing', async () => {
    PurchaseOrder.findByPk.mockResolvedValue(null)
    await expect(service.getById('missing')).rejects.toEqual({ status: 404, message: 'Purchase Order not found' })
  })

  test('joins linkedGoodReceive on the response', async () => {
    PurchaseOrder.findByPk.mockResolvedValue({
      id: 'po1', toJSON() { return { id: 'po1' } },
    })
    GoodReceive.findOne.mockResolvedValue({ id: 'gr', refNo: 'GR-1', status: 'draft' })
    const out = await service.getById('po1')
    expect(out.linkedGoodReceive).toEqual({ id: 'gr', refNo: 'GR-1', status: 'draft' })
  })
})

describe('purchase-order.confirm', () => {
  test('refuses anything other than draft', async () => {
    PurchaseOrder.findByPk.mockResolvedValue({ id: 'po1', status: 'received', items: [] })
    await expect(service.confirm('po1', 'u'))
      .rejects.toEqual({ status: 400, message: 'Only draft orders can be confirmed' })
  })

  test('calls approval-threshold with the line total when user is supplied', async () => {
    const po = {
      id: 'po1', refNo: 'PO-1', status: 'draft', organizationId: 'o',
      items: [{ qty: 4, unitPrice: 25 }, { qty: 2, unitPrice: 10 }], // total 120
      update: jest.fn().mockResolvedValue(),
    }
    PurchaseOrder.findByPk
      .mockResolvedValueOnce(po)
      .mockResolvedValueOnce({ id: 'po1', toJSON() { return { id: 'po1' } } })
    GoodReceive.findOne.mockResolvedValue(null)
    await service.confirm('po1', 'u', { id: 'u', role: 'admin' })
    expect(thresholds.enforce).toHaveBeenCalledWith(expect.objectContaining({
      docType: 'purchase_order',
      amount: 120,
      organizationId: 'o',
    }))
    expect(po.update).toHaveBeenCalledWith({ status: 'confirmed', modifiedBy: 'u' })
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'po.confirm' }))
  })

  test('skips approval check entirely when no user is supplied', async () => {
    const po = {
      id: 'po1', refNo: 'PO-1', status: 'draft', organizationId: 'o', items: [],
      update: jest.fn().mockResolvedValue(),
    }
    PurchaseOrder.findByPk
      .mockResolvedValueOnce(po)
      .mockResolvedValueOnce({ id: 'po1', toJSON() { return { id: 'po1' } } })
    GoodReceive.findOne.mockResolvedValue(null)
    await service.confirm('po1', 'u')
    expect(thresholds.enforce).not.toHaveBeenCalled()
  })
})

describe('purchase-order.receive', () => {
  test('refuses anything other than confirmed', async () => {
    PurchaseOrder.findByPk.mockResolvedValue({ id: 'po1', status: 'draft' })
    await expect(service.receive('po1', 'u'))
      .rejects.toEqual({ status: 400, message: 'Only confirmed orders can be marked as received' })
  })
})

describe('purchase-order.cancel', () => {
  test('refuses received orders', async () => {
    PurchaseOrder.findByPk.mockResolvedValue({ id: 'po1', status: 'received' })
    await expect(service.cancel('po1', 'u'))
      .rejects.toEqual({ status: 400, message: 'Received orders cannot be cancelled' })
  })

  test('refuses already-cancelled orders', async () => {
    PurchaseOrder.findByPk.mockResolvedValue({ id: 'po1', status: 'cancelled' })
    await expect(service.cancel('po1', 'u'))
      .rejects.toEqual({ status: 400, message: 'Already cancelled' })
  })

  test('cancels from draft and confirmed', async () => {
    for (const status of ['draft', 'confirmed']) {
      const po = { id: 'po1', refNo: 'PO-1', status, update: jest.fn().mockResolvedValue() }
      PurchaseOrder.findByPk
        .mockResolvedValueOnce(po)
        .mockResolvedValueOnce({ id: 'po1', toJSON() { return { id: 'po1' } } })
      GoodReceive.findOne.mockResolvedValue(null)
      await service.cancel('po1', 'u')
      expect(po.update).toHaveBeenCalledWith({ status: 'cancelled', modifiedBy: 'u' })
    }
  })
})

describe('purchase-order.remove', () => {
  test('refuses anything other than draft', async () => {
    PurchaseOrder.findByPk.mockResolvedValue({ id: 'po1', status: 'confirmed' })
    await expect(service.remove('po1'))
      .rejects.toEqual({ status: 400, message: 'Only draft orders can be deleted' })
  })

  test('destroys a draft', async () => {
    const po = { id: 'po1', status: 'draft', destroy: jest.fn().mockResolvedValue() }
    PurchaseOrder.findByPk.mockResolvedValue(po)
    await service.remove('po1')
    expect(po.destroy).toHaveBeenCalled()
  })
})

describe('purchase-order.createGoodReceive', () => {
  test('refuses pre-confirmed status', async () => {
    PurchaseOrder.findOne.mockResolvedValue({ id: 'po1', status: 'draft', items: [], toJSON() { return { id: 'po1', status: 'draft', items: [] } } })
    GoodReceive.findOne.mockResolvedValue(null)
    await expect(service.createGoodReceive('po1', 'u', 'o'))
      .rejects.toEqual({ status: 400, message: 'Only confirmed or received purchase orders can generate a Good Receive' })
  })

  test('refuses POs whose items have no productId (description-only)', async () => {
    PurchaseOrder.findOne.mockResolvedValue({
      id: 'po1', status: 'confirmed',
      items: [{ description: 'Service', productId: null }],
      toJSON() { return { id: 'po1', status: 'confirmed', items: [{ description: 'Service', productId: null }] } },
    })
    GoodReceive.findOne.mockResolvedValue(null)
    await expect(service.createGoodReceive('po1', 'u', 'o'))
      .rejects.toEqual({ status: 400, message: 'Purchase order has no product items to receive' })
  })

  test('refuses when a Good Receive already exists, naming it', async () => {
    PurchaseOrder.findOne.mockResolvedValue({
      id: 'po1', status: 'confirmed',
      items: [{ productId: 'p1', qty: 1 }],
      toJSON() { return { id: 'po1', status: 'confirmed', items: [{ productId: 'p1', qty: 1 }] } },
    })
    GoodReceive.findOne
      .mockResolvedValueOnce({ id: 'gr', refNo: 'GR-1' })  // getById join
      .mockResolvedValueOnce({ id: 'gr', refNo: 'GR-1' })  // existence guard
    await expect(service.createGoodReceive('po1', 'u', 'o'))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('GR-1 already exists') })
    expect(grSvc.create).not.toHaveBeenCalled()
  })

  test('falls back to first store when storeId not supplied; rejects when no store exists', async () => {
    PurchaseOrder.findOne.mockResolvedValue({
      id: 'po1', status: 'confirmed',
      items: [{ productId: 'p1', qty: 1, unitPrice: 5 }],
      refNo: 'PO-1', vendor: { name: 'AlphaCo' },
      toJSON() { return { id: 'po1', status: 'confirmed', refNo: 'PO-1', vendor: { name: 'AlphaCo' }, items: [{ productId: 'p1', qty: 1, unitPrice: 5 }] } },
    })
    GoodReceive.findOne.mockResolvedValue(null)
    Store.findOne.mockResolvedValue(null)
    await expect(service.createGoodReceive('po1', 'u', 'org'))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('No store available') })
  })

  test('happy path: forwards items + computed subtotal to good-receive.create', async () => {
    PurchaseOrder.findOne.mockResolvedValue({
      id: 'po1', status: 'confirmed', refNo: 'PO-1',
      vendor: { name: 'AlphaCo' },
      items: [
        { productId: 'p1', qty: 3, unitPrice: 10 }, // 30
        { productId: 'p2', qty: 2, unitPrice: 5  }, // 10
        { productId: null, description: 'Misc', qty: 1, unitPrice: 99 }, // 99 in subtotal, but not a product line
      ],
      toJSON() {
        return {
          id: 'po1', status: 'confirmed', refNo: 'PO-1',
          vendor: { name: 'AlphaCo' },
          items: this.items,
        }
      },
    })
    GoodReceive.findOne.mockResolvedValue(null)
    Store.findOne.mockResolvedValue({ id: 'store-default' })
    grSvc.create.mockResolvedValue({ id: 'gr-new' })

    const out = await service.createGoodReceive('po1', 'u', 'org')
    expect(out).toEqual({ id: 'gr-new' })
    const payload = grSvc.create.mock.calls[0][0]
    expect(payload.purchaseOrderId).toBe('po1')
    expect(payload.supplier).toBe('AlphaCo')
    expect(payload.storeId).toBe('store-default')   // resolved from first Store
    // subtotal counts ALL items (including the description-only line)
    expect(payload.invoiceNetAmount).toBe(139)      // 30 + 10 + 99
    expect(payload.invoiceNo).toBe('PO-PO-1')
    // items list only contains product-backed rows
    expect(payload.items).toEqual([
      { productId: 'p1', qty: 3, cost: 10, discount: 0, discountPct: 0 },
      { productId: 'p2', qty: 2, cost: 5,  discount: 0, discountPct: 0 },
    ])
  })

  test('uses caller-supplied storeId without looking up a default', async () => {
    PurchaseOrder.findOne.mockResolvedValue({
      id: 'po1', status: 'confirmed', refNo: 'PO-1',
      vendor: { name: 'AlphaCo' },
      items: [{ productId: 'p1', qty: 1, unitPrice: 5 }],
      toJSON() { return { id: 'po1', status: 'confirmed', refNo: 'PO-1', vendor: { name: 'AlphaCo' }, items: [{ productId: 'p1', qty: 1, unitPrice: 5 }] } },
    })
    GoodReceive.findOne.mockResolvedValue(null)
    grSvc.create.mockResolvedValue({ id: 'gr-new' })
    await service.createGoodReceive('po1', 'u', 'org', { storeId: 'store-X' })
    expect(Store.findOne).not.toHaveBeenCalled()
    expect(grSvc.create.mock.calls[0][0].storeId).toBe('store-X')
  })
})
