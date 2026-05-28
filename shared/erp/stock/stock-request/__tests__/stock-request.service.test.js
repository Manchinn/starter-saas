// Unit tests for stock/stock-request.service (store-to-store transfers).
//
// confirm() moves stock between two stores and writes paired transfer_out /
// transfer_in movements under a transaction; we don't drive the full happy
// path (brittle) but do pin the guards, the array-form checkStoreLock it
// delegates to stock-count, and the source-store insufficient-stock rule.
// Everything else is the from/to validation in create/update and list shaping.

jest.mock('../../../../../server/models', () => ({
  StockRequest:     { findAndCountAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  StockRequestItem: { destroy: jest.fn(), create: jest.fn() },
  Product:          { findByPk: jest.fn() },
  Store:            { findByPk: jest.fn() },
  StoreStock:       { findOrCreate: jest.fn() },
  StockMovement:    { create: jest.fn() },
}))

jest.mock('../../../../../server/config/database', () => ({ transaction: jest.fn() }))

jest.mock('../../../settings/services/sequence.service', () => ({ getNext: jest.fn(() => 'STR-1') }), { virtual: true })
jest.mock('../../stock-count/stock-count.service', () => ({ checkStoreLock: jest.fn() }), { virtual: true })

const { Op } = require('sequelize')
const { StockRequest, StockRequestItem, Product, Store, StoreStock } = require('../../../../../server/models')
const sequelize = require('../../../../../server/config/database')
const { checkStoreLock } = require('../../stock-count/stock-count.service')
const service = require('../stock-request.service')

beforeEach(() => {
  // resetMocks: true wipes implementations; re-bind transaction to return an
  // object with commit/rollback (the service uses await sequelize.transaction()
  // then explicit commit/rollback, not the callback form).
  sequelize.transaction.mockImplementation(async () => ({
    commit:   jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
  }))
})

describe('stock-request.list', () => {
  beforeEach(() => {
    StockRequest.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
  })

  test('paginates, org+soft-delete scoping, distinct: true, from/to store eager-loads', async () => {
    StockRequest.findAndCountAll.mockResolvedValueOnce({ count: 3, rows: [{ id: 'r1' }] })
    const out = await service.list({ page: 2, limit: 2, organizationId: 'o' })
    expect(out).toEqual({ total: 3, page: 2, limit: 2, requests: [{ id: 'r1' }] })
    const args = StockRequest.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(2)
    expect(args.where.organizationId).toBe('o')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.distinct).toBe(true)
    expect(args.include[0]).toMatchObject({ as: 'fromStore' })
    expect(args.include[1]).toMatchObject({ as: 'toStore' })
  })

  test('search filters across refNo and notes', async () => {
    await service.list({ search: 'urgent', organizationId: 'o' })
    const or = StockRequest.findAndCountAll.mock.calls[0][0].where[Op.or]
    expect(or[0].refNo[Op.like]).toBe('%urgent%')
    expect(or[1].notes[Op.like]).toBe('%urgent%')
  })

  test('no search → no Op.or, still scopes org + soft-delete', async () => {
    await service.list({ organizationId: 'o' })
    const where = StockRequest.findAndCountAll.mock.calls[0][0].where
    expect(where[Op.or]).toBeUndefined()
    expect(where.organizationId).toBe('o')
    expect(where.dataFlag[Op.ne]).toBe(2)
  })
})

describe('stock-request.getById', () => {
  test('throws 404 when missing', async () => {
    StockRequest.findByPk.mockResolvedValue(null)
    await expect(service.getById('missing')).rejects.toEqual({ status: 404, message: 'Stock Transfer not found' })
  })
})

describe('stock-request.create — validation', () => {
  test('rejects missing date / source / destination', async () => {
    await expect(service.create({ fromStoreId: 'a', toStoreId: 'b', items: [{ productId: 'p', qty: 1 }] }))
      .rejects.toEqual({ status: 400, message: 'Date is required' })
    await expect(service.create({ date: '2025-01-01', toStoreId: 'b', items: [{ productId: 'p', qty: 1 }] }))
      .rejects.toEqual({ status: 400, message: 'Source store is required' })
    await expect(service.create({ date: '2025-01-01', fromStoreId: 'a', items: [{ productId: 'p', qty: 1 }] }))
      .rejects.toEqual({ status: 400, message: 'Destination store is required' })
  })

  test('rejects when source and destination are the same store', async () => {
    await expect(service.create({ date: '2025-01-01', fromStoreId: 'a', toStoreId: 'a', items: [{ productId: 'p', qty: 1 }] }))
      .rejects.toEqual({ status: 400, message: 'Source and destination stores must be different' })
  })

  test('rejects empty items', async () => {
    await expect(service.create({ date: '2025-01-01', fromStoreId: 'a', toStoreId: 'b' }))
      .rejects.toEqual({ status: 400, message: 'At least one item is required' })
  })

  test('rejects when source / destination store does not exist', async () => {
    // Promise.all order: [fromStore, toStore]
    Store.findByPk.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'b' })
    await expect(service.create({ date: '2025-01-01', fromStoreId: 'a', toStoreId: 'b', items: [{ productId: 'p', qty: 1 }] }))
      .rejects.toEqual({ status: 400, message: 'Source store not found' })

    Store.findByPk.mockResolvedValueOnce({ id: 'a' }).mockResolvedValueOnce(null)
    await expect(service.create({ date: '2025-01-01', fromStoreId: 'a', toStoreId: 'b', items: [{ productId: 'p', qty: 1 }] }))
      .rejects.toEqual({ status: 400, message: 'Destination store not found' })
  })

  test('rejects items without productId / qty <= 0 (rolls back)', async () => {
    Store.findByPk.mockResolvedValue({ id: 's' })
    StockRequest.create.mockResolvedValue({ id: 'r1' })
    await expect(service.create({ date: '2025-01-01', fromStoreId: 'a', toStoreId: 'b', items: [{ qty: 1 }] }))
      .rejects.toEqual({ status: 400, message: 'Product is required on all items' })

    await expect(service.create({ date: '2025-01-01', fromStoreId: 'a', toStoreId: 'b', items: [{ productId: 'p', qty: 0 }] }))
      .rejects.toEqual({ status: 400, message: 'Quantity must be greater than 0' })
  })

  test('persists items and returns getById', async () => {
    Store.findByPk.mockResolvedValue({ id: 's' })
    StockRequest.create.mockResolvedValue({ id: 'r1' })
    StockRequest.findByPk.mockResolvedValue({ id: 'r1' }) // getById at the end
    const out = await service.create({
      date: '2025-01-01', fromStoreId: 'a', toStoreId: 'b', userId: 'u', organizationId: 'o',
      items: [{ productId: 'p1', qty: 4 }],
    })
    expect(out).toEqual({ id: 'r1' })
    expect(StockRequestItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ stockRequestId: 'r1', productId: 'p1', qty: 4, notes: null, organizationId: 'o' }),
      expect.any(Object),
    )
  })
})

describe('stock-request.update — guards', () => {
  test('throws 404 when missing', async () => {
    StockRequest.findByPk.mockResolvedValue(null)
    await expect(service.update('missing', { date: '2025-01-01', fromStoreId: 'a', toStoreId: 'b', items: [{ productId: 'p', qty: 1 }] }))
      .rejects.toEqual({ status: 404, message: 'Stock Transfer not found' })
  })

  test('refuses to edit a non-draft transfer', async () => {
    StockRequest.findByPk.mockResolvedValue({ id: 'r1', status: 'confirmed' })
    await expect(service.update('r1', { date: '2025-01-01', fromStoreId: 'a', toStoreId: 'b', items: [{ productId: 'p', qty: 1 }] }))
      .rejects.toEqual({ status: 400, message: 'Only draft transfers can be edited' })
  })

  test('rejects same source/destination on edit', async () => {
    StockRequest.findByPk.mockResolvedValue({ id: 'r1', status: 'draft' })
    await expect(service.update('r1', { date: '2025-01-01', fromStoreId: 'a', toStoreId: 'a', items: [{ productId: 'p', qty: 1 }] }))
      .rejects.toEqual({ status: 400, message: 'Source and destination stores must be different' })
  })

  test('replaces items: destroy-then-recreate within the transaction', async () => {
    StockRequest.findByPk.mockResolvedValue({ id: 'r1', status: 'draft', update: jest.fn().mockResolvedValue() })
    Store.findByPk.mockResolvedValue({ id: 's' })
    await service.update('r1', { date: '2025-01-01', fromStoreId: 'a', toStoreId: 'b', items: [{ productId: 'p1', qty: 2 }] })
    expect(StockRequestItem.destroy).toHaveBeenCalledWith(expect.objectContaining({ where: { stockRequestId: 'r1' } }))
    expect(StockRequestItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ stockRequestId: 'r1', productId: 'p1', qty: 2 }),
      expect.any(Object),
    )
  })
})

describe('stock-request.confirm', () => {
  test('throws 404 when missing', async () => {
    StockRequest.findByPk.mockResolvedValue(null)
    await expect(service.confirm('missing')).rejects.toEqual({ status: 404, message: 'Stock Transfer not found' })
  })

  test('refuses to confirm an already-confirmed transfer', async () => {
    StockRequest.findByPk.mockResolvedValue({ id: 'r1', status: 'confirmed', items: [] })
    await expect(service.confirm('r1')).rejects.toEqual({ status: 400, message: 'Already confirmed' })
  })

  test('delegates to stock-count.checkStoreLock with both stores as an array', async () => {
    StockRequest.findByPk.mockResolvedValue({
      id: 'r1', status: 'draft', fromStoreId: 's1', toStoreId: 's2', items: [],
      update: jest.fn().mockResolvedValue(),
    })
    checkStoreLock.mockResolvedValue()
    await service.confirm('r1')
    expect(checkStoreLock).toHaveBeenCalledWith(['s1', 's2'])
  })

  test('aborts when a store is locked (propagates the 409)', async () => {
    StockRequest.findByPk.mockResolvedValue({ id: 'r1', status: 'draft', fromStoreId: 's1', toStoreId: 's2', items: [] })
    checkStoreLock.mockRejectedValue({ status: 409, code: 'STORE_STOCK_LOCKED' })
    await expect(service.confirm('r1')).rejects.toMatchObject({ status: 409, code: 'STORE_STOCK_LOCKED' })
  })

  test('rejects when the source store has insufficient stock (rolls back)', async () => {
    StockRequest.findByPk.mockResolvedValue({
      id: 'r1', status: 'draft', fromStoreId: 's1', toStoreId: 's2', refNo: 'STR-1',
      items: [{ productId: 'p1', qty: 5 }],
      update: jest.fn().mockResolvedValue(),
    })
    checkStoreLock.mockResolvedValue()
    Product.findByPk.mockResolvedValue({ id: 'p1', name: 'Widget' })
    StoreStock.findOrCreate.mockResolvedValue([{ stock: 2, update: jest.fn() }]) // source has 2 < 5
    await expect(service.confirm('r1')).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('Insufficient stock for "Widget" at source store'),
    })
  })
})

describe('stock-request.remove', () => {
  test('throws 404 when missing', async () => {
    StockRequest.findByPk.mockResolvedValue(null)
    await expect(service.remove('missing')).rejects.toEqual({ status: 404, message: 'Stock Transfer not found' })
  })

  test('refuses to delete a confirmed transfer', async () => {
    StockRequest.findByPk.mockResolvedValue({ id: 'r1', status: 'confirmed' })
    await expect(service.remove('r1')).rejects.toEqual({ status: 400, message: 'Cannot delete a confirmed Stock Transfer' })
  })

  test('destroys a draft', async () => {
    const req = { id: 'r1', status: 'draft', destroy: jest.fn().mockResolvedValue() }
    StockRequest.findByPk.mockResolvedValue(req)
    await service.remove('r1')
    expect(req.destroy).toHaveBeenCalled()
  })
})
