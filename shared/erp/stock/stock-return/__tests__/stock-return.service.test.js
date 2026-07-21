// Unit tests for stock/stock-return.service.
//
// Returns come in two flavours that move stock in opposite directions:
// customer_return adds stock (+qty), vendor_return removes it (−qty). The
// confirm() body runs under a transaction; rather than skip it entirely we
// assert the sign of the StockMovement it writes, since that delta is the
// whole point of the module. Everything else is type validation, the
// conditional customer/vendor lookups, and list query shaping.

jest.mock('../../../../../server/models', () => ({
  StockReturn:     { findAndCountAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  StockReturnItem: { destroy: jest.fn(), create: jest.fn() },
  Product:         { findByPk: jest.fn() },
  Store:           { findByPk: jest.fn() },
  Customer:        { findByPk: jest.fn() },
  Vendor:          { findByPk: jest.fn() },
}))

jest.mock('../../../../../server/config/database', () => ({ transaction: jest.fn() }))

jest.mock('../../../settings/services/sequence.service', () => ({ getNext: jest.fn(() => 'RTN-1') }), { virtual: true })
jest.mock('../../stock-count/stock-count.service', () => ({ checkStoreLock: jest.fn() }), { virtual: true })
jest.mock('../../stock-ledger/stock-ledger.service', () => ({ postDelta: jest.fn() }), { virtual: true })

const { Op } = require('sequelize')
const { StockReturn, StockReturnItem, Product, Store, Customer, Vendor } = require('../../../../../server/models')
const sequelize = require('../../../../../server/config/database')
const { checkStoreLock } = require('../../stock-count/stock-count.service')
const stockLedger = require('../../stock-ledger/stock-ledger.service')
const service = require('../stock-return.service')

beforeEach(() => {
  // resetMocks: true wipes implementations; re-bind transaction to return an
  // object with commit/rollback (the service uses await sequelize.transaction()
  // then explicit commit/rollback, not the callback form).
  sequelize.transaction.mockImplementation(async () => ({
    commit:   jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
  }))
})

describe('stock-return.list', () => {
  beforeEach(() => {
    StockReturn.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
  })

  test('paginates, org+soft-delete scoping, distinct, store/customer/vendor eager-loads', async () => {
    StockReturn.findAndCountAll.mockResolvedValueOnce({ count: 3, rows: [{ id: 'r1' }] })
    const out = await service.list({ page: 2, limit: 2, organizationId: 'o' })
    expect(out).toEqual({ total: 3, page: 2, limit: 2, returns: [{ id: 'r1' }] })
    const args = StockReturn.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(2)
    expect(args.where.organizationId).toBe('o')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.where[Op.or]).toBeUndefined()
    expect(args.distinct).toBe(true)
    expect(args.include.map(i => i.as)).toEqual(['store', 'customer', 'vendor'])
  })

  test('search adds an Op.or on refNo only', async () => {
    await service.list({ search: 'RTN-9', organizationId: 'o' })
    const or = StockReturn.findAndCountAll.mock.calls[0][0].where[Op.or]
    expect(or).toHaveLength(1)
    expect(or[0].refNo[Op.like]).toBe('%RTN-9%')
  })

  test('type filter is applied when provided', async () => {
    await service.list({ type: 'vendor_return', organizationId: 'o' })
    expect(StockReturn.findAndCountAll.mock.calls[0][0].where.type).toBe('vendor_return')
  })
})

describe('stock-return.getById', () => {
  test('throws 404 when missing', async () => {
    StockReturn.findByPk.mockResolvedValue(null)
    await expect(service.getById('missing')).rejects.toEqual({ status: 404, message: 'Stock Return not found' })
  })
})

describe('stock-return.create — validation', () => {
  test('rejects missing date', async () => {
    await expect(service.create({ type: 'customer_return', storeId: 's', items: [{ productId: 'p', qty: 1 }] }))
      .rejects.toEqual({ status: 400, message: 'Date is required' })
  })

  test('rejects missing / unknown type', async () => {
    await expect(service.create({ date: '2025-01-01', storeId: 's', items: [{ productId: 'p', qty: 1 }] }))
      .rejects.toEqual({ status: 400, message: 'Type must be customer_return or vendor_return' })
    await expect(service.create({ date: '2025-01-01', type: 'bogus', storeId: 's', items: [{ productId: 'p', qty: 1 }] }))
      .rejects.toEqual({ status: 400, message: 'Type must be customer_return or vendor_return' })
  })

  test('rejects missing store / empty items', async () => {
    await expect(service.create({ date: '2025-01-01', type: 'customer_return', items: [{ productId: 'p', qty: 1 }] }))
      .rejects.toEqual({ status: 400, message: 'Store is required' })
    await expect(service.create({ date: '2025-01-01', type: 'customer_return', storeId: 's' }))
      .rejects.toEqual({ status: 400, message: 'At least one item is required' })
  })

  test('validates customer only for customer_return when a customerId is supplied', async () => {
    Customer.findByPk.mockResolvedValue(null)
    await expect(service.create({
      date: '2025-01-01', type: 'customer_return', storeId: 's', customerId: 'c1',
      items: [{ productId: 'p', qty: 1 }],
    })).rejects.toEqual({ status: 400, message: 'Customer not found' })
  })

  test('validates vendor only for vendor_return when a vendorId is supplied', async () => {
    Vendor.findByPk.mockResolvedValue(null)
    await expect(service.create({
      date: '2025-01-01', type: 'vendor_return', storeId: 's', vendorId: 'v1',
      items: [{ productId: 'p', qty: 1 }],
    })).rejects.toEqual({ status: 400, message: 'Vendor not found' })
  })

  test('rejects when the store does not exist', async () => {
    Store.findByPk.mockResolvedValue(null)
    await expect(service.create({
      date: '2025-01-01', type: 'customer_return', storeId: 'missing',
      items: [{ productId: 'p', qty: 1 }],
    })).rejects.toEqual({ status: 400, message: 'Store not found' })
  })

  test('rejects items without productId / qty <= 0 (rolls back)', async () => {
    Store.findByPk.mockResolvedValue({ id: 's' })
    StockReturn.create.mockResolvedValue({ id: 'r1' })
    await expect(service.create({ date: '2025-01-01', type: 'customer_return', storeId: 's', items: [{ qty: 1 }] }))
      .rejects.toEqual({ status: 400, message: 'Product is required on all items' })
    await expect(service.create({ date: '2025-01-01', type: 'customer_return', storeId: 's', items: [{ productId: 'p', qty: 0 }] }))
      .rejects.toEqual({ status: 400, message: 'Quantity must be greater than 0' })
  })

  test('persists numeric qty/cost and nulls the irrelevant party id for the type', async () => {
    Customer.findByPk.mockResolvedValue({ id: 'c1' })
    Store.findByPk.mockResolvedValue({ id: 's' })
    StockReturn.create.mockResolvedValue({ id: 'r1' })
    StockReturn.findByPk.mockResolvedValue({ id: 'r1' }) // getById
    await service.create({
      date: '2025-01-01', type: 'customer_return', storeId: 's', customerId: 'c1', organizationId: 'o',
      items: [{ productId: 'p1', qty: '3', cost: '2.50' }],
    })
    // customer_return → customerId kept, vendorId forced null
    expect(StockReturn.create.mock.calls[0][0]).toMatchObject({ customerId: 'c1', vendorId: null, type: 'customer_return' })
    expect(StockReturnItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ stockReturnId: 'r1', productId: 'p1', qty: 3, cost: 2.5 }),
      expect.any(Object),
    )
  })
})

describe('stock-return.update — guards', () => {
  test('throws 404 when missing', async () => {
    StockReturn.findByPk.mockResolvedValue(null)
    await expect(service.update('missing', { date: '2025-01-01', type: 'customer_return', storeId: 's', items: [{ productId: 'p', qty: 1 }] }))
      .rejects.toEqual({ status: 404, message: 'Stock Return not found' })
  })

  test('refuses to edit a non-draft return', async () => {
    StockReturn.findByPk.mockResolvedValue({ id: 'r1', status: 'confirmed' })
    await expect(service.update('r1', { date: '2025-01-01', type: 'customer_return', storeId: 's', items: [{ productId: 'p', qty: 1 }] }))
      .rejects.toEqual({ status: 400, message: 'Only draft returns can be edited' })
  })

  test('replaces items: destroy-then-recreate within the transaction', async () => {
    StockReturn.findByPk.mockResolvedValue({ id: 'r1', status: 'draft', update: jest.fn().mockResolvedValue() })
    Store.findByPk.mockResolvedValue({ id: 's' })
    await service.update('r1', { date: '2025-01-01', type: 'customer_return', storeId: 's', items: [{ productId: 'p1', qty: 2 }] })
    expect(StockReturnItem.destroy).toHaveBeenCalledWith(expect.objectContaining({ where: { stockReturnId: 'r1' } }))
    expect(StockReturnItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ stockReturnId: 'r1', productId: 'p1', qty: 2 }),
      expect.any(Object),
    )
  })
})

describe('stock-return.confirm', () => {
  test('throws 404 when missing', async () => {
    StockReturn.findByPk.mockResolvedValue(null)
    await expect(service.confirm('missing')).rejects.toEqual({ status: 404, message: 'Stock Return not found' })
  })

  test('refuses to confirm an already-confirmed return', async () => {
    StockReturn.findByPk.mockResolvedValue({ id: 'r1', status: 'confirmed', items: [] })
    await expect(service.confirm('r1')).rejects.toEqual({ status: 400, message: 'Already confirmed' })
  })

  test('skips the store-lock check when there is no storeId', async () => {
    StockReturn.findByPk.mockResolvedValue({
      id: 'r1', status: 'draft', type: 'customer_return', storeId: null, items: [],
      update: jest.fn().mockResolvedValue(),
    })
    await service.confirm('r1')
    expect(checkStoreLock).not.toHaveBeenCalled()
  })

  test('customer_return ADDS stock via postDelta (+qty), store-lock checked', async () => {
    StockReturn.findByPk.mockResolvedValue({
      id: 'r1', status: 'draft', type: 'customer_return', storeId: 's1', refNo: 'RTN-1',
      organizationId: 'org-1',
      items: [{ productId: 'p1', qty: '3', reason: 'defect' }],
      update: jest.fn().mockResolvedValue(),
    })
    checkStoreLock.mockResolvedValue()
    stockLedger.postDelta.mockResolvedValue({ stockBefore: 10, stockAfter: 13 })
    await service.confirm('r1')
    expect(checkStoreLock).toHaveBeenCalledWith('s1')
    expect(stockLedger.postDelta).toHaveBeenCalledWith(expect.objectContaining({
      productId: 'p1',
      storeId: 's1',
      qty: 3,
      type: 'customer_return',
      refType: 'StockReturn',
      refId: 'r1',
      refNo: 'RTN-1',
      notes: 'defect',
      organizationId: 'org-1',
    }))
  })

  test('vendor_return REMOVES stock via postDelta (−qty)', async () => {
    StockReturn.findByPk.mockResolvedValue({
      id: 'r1', status: 'draft', type: 'vendor_return', storeId: 's1', refNo: 'RTN-1',
      organizationId: null,
      items: [{ productId: 'p1', qty: '3' }],
      update: jest.fn().mockResolvedValue(),
    })
    checkStoreLock.mockResolvedValue()
    stockLedger.postDelta.mockResolvedValue({ stockBefore: 10, stockAfter: 7 })
    await service.confirm('r1')
    expect(stockLedger.postDelta).toHaveBeenCalledWith(expect.objectContaining({
      productId: 'p1',
      storeId: 's1',
      qty: -3,
      type: 'vendor_return',
      organizationId: null,
    }))
  })
})

describe('stock-return.remove', () => {
  test('throws 404 when missing', async () => {
    StockReturn.findByPk.mockResolvedValue(null)
    await expect(service.remove('missing')).rejects.toEqual({ status: 404, message: 'Stock Return not found' })
  })

  test('refuses to delete a confirmed return', async () => {
    StockReturn.findByPk.mockResolvedValue({ id: 'r1', status: 'confirmed' })
    await expect(service.remove('r1')).rejects.toEqual({ status: 400, message: 'Cannot delete a confirmed Stock Return' })
  })

  test('destroys a draft', async () => {
    const sr = { id: 'r1', status: 'draft', destroy: jest.fn().mockResolvedValue() }
    StockReturn.findByPk.mockResolvedValue(sr)
    await service.remove('r1')
    expect(sr.destroy).toHaveBeenCalled()
  })
})
