// Unit tests for stock/stock-count.service.
//
// confirm() walks StoreStock/Product/StockMovement under a transaction (same
// brittleness rationale as good-receive); we cover its guards but not its body.
// The genuinely interesting logic here is checkStoreLock (the movement-lock
// conflict used by other modules), the getStoreProducts mapping, and setLock's
// no-op short-circuit + audit hook.

jest.mock('../../../../../server/models', () => ({
  StockCount:     { findAndCountAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  StockCountItem: { destroy: jest.fn(), create: jest.fn() },
  Product:        { findByPk: jest.fn() },
  Store:          { findByPk: jest.fn() },
  StoreStock:     { findAll: jest.fn() },
  StockMovement:  {},
}))

jest.mock('../../../../../server/config/database', () => ({ transaction: jest.fn() }))

jest.mock('../../../audit/audit.service', () => ({ log: jest.fn() }))
jest.mock('../../../settings/services/sequence.service', () => ({ getNext: jest.fn(() => 'CNT-1') }), { virtual: true })

const { Op } = require('sequelize')
const { StockCount, StockCountItem, Store, StoreStock } = require('../../../../../server/models')
const sequelize = require('../../../../../server/config/database')
const audit = require('../../../audit/audit.service')
const service = require('../stock-count.service')

beforeEach(() => {
  // resetMocks: true wipes implementations; re-bind transaction to return an
  // object with commit/rollback (the service uses await sequelize.transaction()
  // then explicit commit/rollback, not the callback form).
  sequelize.transaction.mockImplementation(async () => ({
    commit:   jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
  }))
})

describe('stock-count.list', () => {
  beforeEach(() => {
    StockCount.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
  })

  test('paginates, org+soft-delete scoping, distinct: true, store eager-load', async () => {
    StockCount.findAndCountAll.mockResolvedValueOnce({ count: 3, rows: [{ id: 'c1' }] })
    const out = await service.list({ page: 2, limit: 2, organizationId: 'o' })
    expect(out).toEqual({ total: 3, page: 2, limit: 2, counts: [{ id: 'c1' }] })
    const args = StockCount.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(2)
    expect(args.where.organizationId).toBe('o')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.distinct).toBe(true)
    expect(args.include[0]).toMatchObject({ as: 'store' })
  })

  test('search filters on refNo', async () => {
    await service.list({ search: 'CNT-9', organizationId: 'o' })
    const or = StockCount.findAndCountAll.mock.calls[0][0].where[Op.or]
    expect(or[0].refNo[Op.like]).toBe('%CNT-9%')
  })

  test('no search → no Op.or, still scopes org + soft-delete', async () => {
    await service.list({ organizationId: 'o' })
    const where = StockCount.findAndCountAll.mock.calls[0][0].where
    expect(where[Op.or]).toBeUndefined()
    expect(where.organizationId).toBe('o')
    expect(where.dataFlag[Op.ne]).toBe(2)
  })
})

describe('stock-count.getById', () => {
  test('throws 404 when missing', async () => {
    StockCount.findByPk.mockResolvedValue(null)
    await expect(service.getById('missing')).rejects.toEqual({ status: 404, message: 'Stock Count not found' })
  })
})

describe('stock-count.getStoreProducts', () => {
  test('throws 404 when the store does not exist', async () => {
    Store.findByPk.mockResolvedValue(null)
    await expect(service.getStoreProducts('missing')).rejects.toEqual({ status: 404, message: 'Store not found' })
  })

  test('maps store stock rows to {productId,name,sku,systemQty} and filters active products', async () => {
    Store.findByPk.mockResolvedValue({ id: 's1' })
    StoreStock.findAll.mockResolvedValue([
      { productId: 'p1', stock: '7.5', product: { name: 'Widget', sku: 'W-1' } },
    ])
    const out = await service.getStoreProducts('s1')
    expect(out).toEqual([{ productId: 'p1', name: 'Widget', sku: 'W-1', systemQty: 7.5 }])
    // active-only filter lives on the eager-loaded product include
    expect(StoreStock.findAll.mock.calls[0][0].include[0].where).toEqual({ status: 'active' })
  })
})

describe('stock-count.checkStoreLock', () => {
  test('no-op (no query) when given empty / falsy input', async () => {
    await expect(service.checkStoreLock([])).resolves.toBeUndefined()
    await expect(service.checkStoreLock(null)).resolves.toBeUndefined()
    expect(StockCount.findOne).not.toHaveBeenCalled()
  })

  test('resolves silently when no store holds the lock', async () => {
    StockCount.findOne.mockResolvedValue(null)
    await expect(service.checkStoreLock('s1')).resolves.toBeUndefined()
    // single id is wrapped into an Op.in array
    expect(StockCount.findOne.mock.calls[0][0].where.storeId[Op.in]).toEqual(['s1'])
  })

  test('array input is filtered of falsy ids before the Op.in query', async () => {
    StockCount.findOne.mockResolvedValue(null)
    await service.checkStoreLock(['s1', null, 's2', ''])
    expect(StockCount.findOne.mock.calls[0][0].where.storeId[Op.in]).toEqual(['s1', 's2'])
  })

  test('throws 409 with lock details when a store is locked', async () => {
    StockCount.findOne.mockResolvedValue({
      id: 'sc1', refNo: 'CNT-7', date: '2025-01-01', storeId: 's1',
      store: { name: 'Main Warehouse' },
    })
    await expect(service.checkStoreLock('s1')).rejects.toMatchObject({
      status: 409,
      code: 'STORE_STOCK_LOCKED',
      message: expect.stringContaining('Main Warehouse is locked for stock count CNT-7'),
      lock: { stockCountId: 'sc1', refNo: 'CNT-7', storeId: 's1', storeName: 'Main Warehouse' },
    })
  })

  test('falls back to "this store" when the lock owner has no store name', async () => {
    StockCount.findOne.mockResolvedValue({ id: 'sc1', refNo: 'CNT-7', date: '2025-01-01', storeId: 's1', store: null })
    await expect(service.checkStoreLock('s1')).rejects.toMatchObject({
      message: expect.stringContaining('this store is locked'),
      lock: { storeName: 'this store' },
    })
  })
})

describe('stock-count.create — validation', () => {
  test('rejects missing date / store / empty items', async () => {
    await expect(service.create({ storeId: 's', items: [{ productId: 'p' }] }))
      .rejects.toEqual({ status: 400, message: 'Date is required' })
    await expect(service.create({ date: '2025-01-01', items: [{ productId: 'p' }] }))
      .rejects.toEqual({ status: 400, message: 'Store is required' })
    await expect(service.create({ date: '2025-01-01', storeId: 's' }))
      .rejects.toEqual({ status: 400, message: 'At least one item is required' })
  })

  test('rejects when the store does not exist', async () => {
    Store.findByPk.mockResolvedValue(null)
    await expect(service.create({ date: '2025-01-01', storeId: 'missing', items: [{ productId: 'p' }] }))
      .rejects.toEqual({ status: 400, message: 'Store not found' })
  })

  test('rejects items without productId (rolls back)', async () => {
    Store.findByPk.mockResolvedValue({ id: 's' })
    StockCount.create.mockResolvedValue({ id: 'sc1' })
    await expect(service.create({ date: '2025-01-01', storeId: 's', items: [{ countedQty: 1 }] }))
      .rejects.toEqual({ status: 400, message: 'Product is required on all items' })
  })

  test('persists items with qty defaults (systemQty/countedQty ?? 0) and returns getById', async () => {
    Store.findByPk.mockResolvedValue({ id: 's' })
    StockCount.create.mockResolvedValue({ id: 'sc1' })
    StockCount.findByPk.mockResolvedValue({ id: 'sc1' }) // getById at the end
    const out = await service.create({
      date: '2025-01-01', storeId: 's', userId: 'u', organizationId: 'o',
      items: [{ productId: 'p1', systemQty: 5 }], // countedQty omitted → 0
    })
    expect(out).toEqual({ id: 'sc1' })
    expect(StockCountItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ stockCountId: 'sc1', productId: 'p1', systemQty: 5, countedQty: 0, organizationId: 'o' }),
      expect.any(Object),
    )
  })
})

describe('stock-count.update — guards', () => {
  test('throws 404 when missing', async () => {
    StockCount.findByPk.mockResolvedValue(null)
    await expect(service.update('missing', { date: '2025-01-01', storeId: 's', items: [] }))
      .rejects.toEqual({ status: 404, message: 'Stock Count not found' })
  })

  test('refuses to update a confirmed count', async () => {
    StockCount.findByPk.mockResolvedValue({ id: 'c1', status: 'confirmed' })
    await expect(service.update('c1', { date: '2025-01-01', storeId: 's', items: [] }))
      .rejects.toEqual({ status: 400, message: 'Cannot update a confirmed stock count' })
  })

  test('replaces items: destroy-then-recreate within the transaction', async () => {
    StockCount.findByPk.mockResolvedValue({ id: 'c1', status: 'draft', update: jest.fn().mockResolvedValue() })
    await service.update('c1', { date: '2025-01-01', storeId: 's', items: [{ productId: 'p1', countedQty: 2 }] })
    expect(StockCountItem.destroy).toHaveBeenCalledWith(expect.objectContaining({ where: { stockCountId: 'c1' } }))
    expect(StockCountItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ stockCountId: 'c1', productId: 'p1', countedQty: 2 }),
      expect.any(Object),
    )
  })
})

describe('stock-count.confirm — guards', () => {
  test('throws 404 when missing', async () => {
    StockCount.findByPk.mockResolvedValue(null)
    await expect(service.confirm('missing')).rejects.toEqual({ status: 404, message: 'Stock Count not found' })
  })

  test('refuses to confirm an already-confirmed count', async () => {
    StockCount.findByPk.mockResolvedValue({ id: 'c1', status: 'confirmed', items: [] })
    await expect(service.confirm('c1')).rejects.toEqual({ status: 400, message: 'Already confirmed' })
  })
})

describe('stock-count.setLock', () => {
  test('throws 404 when missing', async () => {
    StockCount.findByPk.mockResolvedValue(null)
    await expect(service.setLock('missing', true)).rejects.toEqual({ status: 404, message: 'Stock Count not found' })
  })

  test('refuses to change lock state of a non-draft count', async () => {
    StockCount.findByPk.mockResolvedValue({ id: 'c1', status: 'confirmed' })
    await expect(service.setLock('c1', true))
      .rejects.toEqual({ status: 400, message: 'Only draft stock counts can change their lock state' })
  })

  test('no-op when already in the requested state (no update, no audit)', async () => {
    const sc = { id: 'c1', status: 'draft', movementLocked: true, update: jest.fn() }
    StockCount.findByPk.mockResolvedValue(sc)
    await service.setLock('c1', true)
    expect(sc.update).not.toHaveBeenCalled()
    expect(audit.log).not.toHaveBeenCalled()
  })

  test('toggles the lock and writes a "locked" audit entry', async () => {
    const sc = { id: 'c1', status: 'draft', movementLocked: false, refNo: 'CNT-1', storeId: 's1', update: jest.fn().mockResolvedValue() }
    StockCount.findByPk.mockResolvedValue(sc)
    await service.setLock('c1', true, 'u')
    expect(sc.update).toHaveBeenCalledWith({ movementLocked: true, modifiedBy: 'u' })
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'u', action: 'stock-count.locked', entityId: 'c1',
    }))
  })

  test('unlocking writes an "unlocked" audit entry', async () => {
    const sc = { id: 'c1', status: 'draft', movementLocked: true, refNo: 'CNT-1', storeId: 's1', update: jest.fn().mockResolvedValue() }
    StockCount.findByPk.mockResolvedValue(sc)
    await service.setLock('c1', false, 'u')
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'stock-count.unlocked' }))
  })
})

describe('stock-count.remove', () => {
  test('throws 404 when missing', async () => {
    StockCount.findByPk.mockResolvedValue(null)
    await expect(service.remove('missing')).rejects.toEqual({ status: 404, message: 'Stock Count not found' })
  })

  test('refuses to delete a confirmed count', async () => {
    StockCount.findByPk.mockResolvedValue({ id: 'c1', status: 'confirmed' })
    await expect(service.remove('c1')).rejects.toEqual({ status: 400, message: 'Cannot delete a confirmed stock count' })
  })

  test('destroys a draft', async () => {
    const sc = { id: 'c1', status: 'draft', destroy: jest.fn().mockResolvedValue() }
    StockCount.findByPk.mockResolvedValue(sc)
    await service.remove('c1')
    expect(sc.destroy).toHaveBeenCalled()
  })
})
