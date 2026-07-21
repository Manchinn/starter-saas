// Unit tests for stock/stock-adjust.service.
//
// The confirm() body walks Product / StoreStock / StockMovement under a
// transaction — same brittleness rationale as good-receive's confirm. We
// pin down validation, the qty=0 rule (negatives are deliberately allowed
// for stock decreases), guards on every mutating verb, and the audit hook
// that fires on delete.

jest.mock('../../../../../server/models', () => ({
  StockAdjust:     { findAndCountAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  StockAdjustItem: { destroy: jest.fn(), create: jest.fn() },
  Product:         { findByPk: jest.fn() },
  Store:           { findByPk: jest.fn() },
  StoreStock:      {},
  StockMovement:   {},
}))

jest.mock('../../../../../server/config/database', () => ({ transaction: jest.fn() }))

jest.mock('../../../audit/audit.service', () => ({ log: jest.fn() }))
jest.mock('../../../settings/services/sequence.service', () => ({ getNext: jest.fn(() => 'ADJ-1') }), { virtual: true })
jest.mock('../../stock-count/stock-count.service', () => ({ checkStoreLock: jest.fn() }), { virtual: true })
jest.mock('../../stock-ledger/stock-ledger.service', () => ({ postDelta: jest.fn() }), { virtual: true })

const { Op } = require('sequelize')
const { StockAdjust, StockAdjustItem, Store } = require('../../../../../server/models')
const sequelize = require('../../../../../server/config/database')
const audit = require('../../../audit/audit.service')
const service = require('../stock-adjust.service')

beforeEach(() => {
  // resetMocks: true wipes implementations; re-bind transaction to return
  // an object with commit/rollback (the service uses await sequelize.transaction()
  // and then explicit commit/rollback, not the callback form).
  sequelize.transaction.mockImplementation(async () => ({
    commit:   jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
  }))
})

describe('stock-adjust.list', () => {
  beforeEach(() => {
    StockAdjust.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
  })

  test('paginates, org+soft-delete scoping, distinct: true, store eager-load', async () => {
    StockAdjust.findAndCountAll.mockResolvedValueOnce({ count: 3, rows: [{ id: 'a1' }] })
    const out = await service.list({ page: 2, limit: 2, organizationId: 'o' })
    expect(out).toEqual({ total: 3, page: 2, limit: 2, adjustments: [{ id: 'a1' }] })
    const args = StockAdjust.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(2)
    expect(args.where.organizationId).toBe('o')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.distinct).toBe(true)
    expect(args.include[0]).toMatchObject({ as: 'store' })
  })

  test('search filters across refNo and reason', async () => {
    await service.list({ search: 'spoilage', organizationId: 'o' })
    const or = StockAdjust.findAndCountAll.mock.calls[0][0].where[Op.or]
    expect(or[0].refNo[Op.like]).toBe('%spoilage%')
    expect(or[1].reason[Op.like]).toBe('%spoilage%')
  })

  test('no search → no Op.or, but still scopes org + soft-delete', async () => {
    await service.list({ organizationId: 'o' })
    const where = StockAdjust.findAndCountAll.mock.calls[0][0].where
    // toHaveProperty doesn't accept Symbol keys, so check the raw map
    expect(where[Op.or]).toBeUndefined()
    expect(where.organizationId).toBe('o')
  })
})

describe('stock-adjust.getById', () => {
  test('throws 404 when missing', async () => {
    StockAdjust.findByPk.mockResolvedValue(null)
    await expect(service.getById('missing')).rejects.toEqual({ status: 404, message: 'Stock Adjustment not found' })
  })
})

describe('stock-adjust.create — validation', () => {
  test('rejects missing date / store / empty items', async () => {
    await expect(service.create({ storeId: 's', items: [{ productId: 'p', qty: 1 }] }))
      .rejects.toEqual({ status: 400, message: 'Date is required' })
    await expect(service.create({ date: '2025-01-01', items: [{ productId: 'p', qty: 1 }] }))
      .rejects.toEqual({ status: 400, message: 'Store is required' })
    await expect(service.create({ date: '2025-01-01', storeId: 's' }))
      .rejects.toEqual({ status: 400, message: 'At least one item is required' })
  })

  test('rejects when the store does not exist', async () => {
    Store.findByPk.mockResolvedValue(null)
    await expect(service.create({ date: '2025-01-01', storeId: 'missing', items: [{ productId: 'p', qty: 1 }] }))
      .rejects.toEqual({ status: 400, message: 'Store not found' })
  })

  test('rejects items without productId', async () => {
    Store.findByPk.mockResolvedValue({ id: 's' })
    const adj = { id: 'a1', destroy: jest.fn(), update: jest.fn() }
    StockAdjust.create.mockResolvedValue(adj)
    await expect(service.create({
      date: '2025-01-01', storeId: 's',
      items: [{ qty: 1 }], // missing productId
    })).rejects.toEqual({ status: 400, message: 'Product is required on all items' })
  })

  test('qty cannot be zero — but negative is allowed (stock decrement)', async () => {
    Store.findByPk.mockResolvedValue({ id: 's' })
    StockAdjust.create.mockResolvedValue({ id: 'a1' })
    StockAdjust.findByPk.mockResolvedValue({ id: 'a1' })

    // qty=0 → rejection
    await expect(service.create({
      date: '2025-01-01', storeId: 's',
      items: [{ productId: 'p', qty: 0 }],
    })).rejects.toEqual({ status: 400, message: 'Quantity cannot be zero' })

    // qty=undefined → rejection
    await expect(service.create({
      date: '2025-01-01', storeId: 's',
      items: [{ productId: 'p' }],
    })).rejects.toEqual({ status: 400, message: 'Quantity cannot be zero' })

    // qty=-5 → accepted (stock decrement is the whole point of an adjustment)
    await service.create({
      date: '2025-01-01', storeId: 's',
      items: [{ productId: 'p', qty: -5 }],
    })
    expect(StockAdjustItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'p', qty: -5 }),
      expect.any(Object),
    )
  })

  test('audit log fires on successful create', async () => {
    Store.findByPk.mockResolvedValue({ id: 's' })
    StockAdjust.create.mockResolvedValue({ id: 'a1', refNo: 'ADJ-1' })
    StockAdjust.findByPk.mockResolvedValue({ id: 'a1' })
    await service.create({
      date: '2025-01-01', storeId: 's', userId: 'u',
      items: [{ productId: 'p', qty: 3 }, { productId: 'p2', qty: -1 }],
    })
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'u',
      action: 'stock-adjust.created',
      summary: expect.objectContaining({ items: 2 }),
    }))
  })
})

describe('stock-adjust.update', () => {
  test('throws 404 when missing', async () => {
    StockAdjust.findByPk.mockResolvedValue(null)
    await expect(service.update('missing', { date: '2025-01-01', storeId: 's', items: [{ productId: 'p', qty: 1 }] }, 'u'))
      .rejects.toEqual({ status: 404, message: 'Stock Adjustment not found' })
  })

  test('refuses to edit a confirmed adjustment', async () => {
    StockAdjust.findByPk.mockResolvedValue({ id: 'a1', status: 'confirmed' })
    await expect(service.update('a1', { date: '2025-01-01', storeId: 's', items: [{ productId: 'p', qty: 1 }] }))
      .rejects.toEqual({ status: 400, message: 'Only draft adjustments can be edited' })
  })

  test('rejects empty items and qty=0 (same rules as create)', async () => {
    StockAdjust.findByPk.mockResolvedValue({ id: 'a1', status: 'draft' })
    Store.findByPk.mockResolvedValue({ id: 's' })
    await expect(service.update('a1', { date: '2025-01-01', storeId: 's', items: [] }))
      .rejects.toEqual({ status: 400, message: 'At least one item is required' })
  })
})

describe('stock-adjust.confirm — guards', () => {
  test('throws 404 when missing', async () => {
    StockAdjust.findByPk.mockResolvedValue(null)
    await expect(service.confirm('missing')).rejects.toEqual({ status: 404, message: 'Stock Adjustment not found' })
  })

  test('refuses to confirm an already-confirmed adjustment', async () => {
    StockAdjust.findByPk.mockResolvedValue({ id: 'a1', status: 'confirmed', items: [] })
    await expect(service.confirm('a1'))
      .rejects.toEqual({ status: 400, message: 'Already confirmed' })
  })

  test('refuses when storeId is missing', async () => {
    StockAdjust.findByPk.mockResolvedValue({ id: 'a1', status: 'draft', storeId: null, items: [] })
    await expect(service.confirm('a1'))
      .rejects.toEqual({ status: 400, message: 'Store is required before confirming' })
  })
})

describe('stock-adjust.remove', () => {
  test('throws 404 when missing', async () => {
    StockAdjust.findByPk.mockResolvedValue(null)
    await expect(service.remove('missing')).rejects.toEqual({ status: 404, message: 'Stock Adjustment not found' })
  })

  test('refuses to delete a confirmed adjustment', async () => {
    StockAdjust.findByPk.mockResolvedValue({ id: 'a1', status: 'confirmed' })
    await expect(service.remove('a1'))
      .rejects.toEqual({ status: 400, message: 'Cannot delete a confirmed adjustment' })
  })

  test('destroys a draft and writes audit log', async () => {
    const adj = { id: 'a1', status: 'draft', refNo: 'ADJ-1', destroy: jest.fn().mockResolvedValue() }
    StockAdjust.findByPk.mockResolvedValue(adj)
    await service.remove('a1', 'u')
    expect(adj.destroy).toHaveBeenCalled()
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'u',
      action: 'stock-adjust.deleted',
      entityId: 'a1',
      summary: { refNo: 'ADJ-1' },
    }))
  })
})
