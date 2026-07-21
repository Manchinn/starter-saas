// Unit tests for stock/stock-issue.service.
//
// confirm() decrements product + store stock and writes movements under a
// transaction; we don't exercise the full happy path (brittle), but we do
// pin the guards, the store-lock check it delegates to stock-count, and the
// insufficient-stock rejection since that's a real business rule. Everything
// else is validation / query shaping in the create/update/list family.

jest.mock('../../../../../server/models', () => ({
  StockIssue:     { findAndCountAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  StockIssueItem: { destroy: jest.fn(), create: jest.fn() },
  Product:        { findByPk: jest.fn() },
  Store:          { findByPk: jest.fn() },
  StoreStock:     { findOrCreate: jest.fn() },
  StockMovement:  { create: jest.fn() },
}))

jest.mock('../../../../../server/config/database', () => ({ transaction: jest.fn() }))

jest.mock('../../../settings/services/sequence.service', () => ({ getNext: jest.fn(() => 'ISS-1') }), { virtual: true })
jest.mock('../../stock-count/stock-count.service', () => ({ checkStoreLock: jest.fn() }), { virtual: true })
jest.mock('../../stock-ledger/stock-ledger.service', () => ({ postDelta: jest.fn() }), { virtual: true })

const { Op } = require('sequelize')
const { StockIssue, StockIssueItem, Product, Store, StoreStock } = require('../../../../../server/models')
const sequelize = require('../../../../../server/config/database')
const { checkStoreLock } = require('../../stock-count/stock-count.service')
const service = require('../stock-issue.service')

beforeEach(() => {
  // resetMocks: true wipes implementations; re-bind transaction to return an
  // object with commit/rollback (the service uses await sequelize.transaction()
  // then explicit commit/rollback, not the callback form).
  sequelize.transaction.mockImplementation(async () => ({
    commit:   jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
  }))
})

describe('stock-issue.list', () => {
  beforeEach(() => {
    StockIssue.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
  })

  test('paginates, org+soft-delete scoping, distinct: true, store eager-load', async () => {
    StockIssue.findAndCountAll.mockResolvedValueOnce({ count: 3, rows: [{ id: 'i1' }] })
    const out = await service.list({ page: 2, limit: 2, organizationId: 'o' })
    expect(out).toEqual({ total: 3, page: 2, limit: 2, issues: [{ id: 'i1' }] })
    const args = StockIssue.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(2)
    expect(args.where.organizationId).toBe('o')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.distinct).toBe(true)
    expect(args.include[0]).toMatchObject({ as: 'store' })
  })

  test('search filters across refNo and reason', async () => {
    await service.list({ search: 'spoilage', organizationId: 'o' })
    const or = StockIssue.findAndCountAll.mock.calls[0][0].where[Op.or]
    expect(or[0].refNo[Op.like]).toBe('%spoilage%')
    expect(or[1].reason[Op.like]).toBe('%spoilage%')
  })

  test('no search → no Op.or, still scopes org + soft-delete', async () => {
    await service.list({ organizationId: 'o' })
    const where = StockIssue.findAndCountAll.mock.calls[0][0].where
    expect(where[Op.or]).toBeUndefined()
    expect(where.organizationId).toBe('o')
    expect(where.dataFlag[Op.ne]).toBe(2)
  })
})

describe('stock-issue.getById', () => {
  test('throws 404 when missing', async () => {
    StockIssue.findByPk.mockResolvedValue(null)
    await expect(service.getById('missing')).rejects.toEqual({ status: 404, message: 'Stock Issue not found' })
  })
})

describe('stock-issue.create — validation', () => {
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

  test('rejects items without productId (rolls back)', async () => {
    Store.findByPk.mockResolvedValue({ id: 's' })
    StockIssue.create.mockResolvedValue({ id: 'i1' })
    await expect(service.create({ date: '2025-01-01', storeId: 's', items: [{ qty: 1 }] }))
      .rejects.toEqual({ status: 400, message: 'Product is required on all items' })
  })

  test('rejects qty <= 0 and missing qty (must be > 0)', async () => {
    Store.findByPk.mockResolvedValue({ id: 's' })
    StockIssue.create.mockResolvedValue({ id: 'i1' })
    await expect(service.create({ date: '2025-01-01', storeId: 's', items: [{ productId: 'p', qty: 0 }] }))
      .rejects.toEqual({ status: 400, message: 'Quantity must be greater than 0' })
    await expect(service.create({ date: '2025-01-01', storeId: 's', items: [{ productId: 'p', qty: -2 }] }))
      .rejects.toEqual({ status: 400, message: 'Quantity must be greater than 0' })
    await expect(service.create({ date: '2025-01-01', storeId: 's', items: [{ productId: 'p' }] }))
      .rejects.toEqual({ status: 400, message: 'Quantity must be greater than 0' })
  })

  test('persists items (with batch/expiry/notes nulls) and returns getById', async () => {
    Store.findByPk.mockResolvedValue({ id: 's' })
    StockIssue.create.mockResolvedValue({ id: 'i1' })
    StockIssue.findByPk.mockResolvedValue({ id: 'i1' }) // getById at the end
    const out = await service.create({
      date: '2025-01-01', storeId: 's', userId: 'u', organizationId: 'o',
      items: [{ productId: 'p1', qty: 3 }],
    })
    expect(out).toEqual({ id: 'i1' })
    expect(StockIssueItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        stockIssueId: 'i1', productId: 'p1', qty: 3,
        batchId: null, expiryDate: null, notes: null, organizationId: 'o',
      }),
      expect.any(Object),
    )
  })
})

describe('stock-issue.update — guards', () => {
  test('throws 404 when missing', async () => {
    StockIssue.findByPk.mockResolvedValue(null)
    await expect(service.update('missing', { date: '2025-01-01', storeId: 's', items: [{ productId: 'p', qty: 1 }] }))
      .rejects.toEqual({ status: 404, message: 'Stock Issue not found' })
  })

  test('refuses to edit a non-draft issue', async () => {
    StockIssue.findByPk.mockResolvedValue({ id: 'i1', status: 'confirmed' })
    await expect(service.update('i1', { date: '2025-01-01', storeId: 's', items: [{ productId: 'p', qty: 1 }] }))
      .rejects.toEqual({ status: 400, message: 'Only draft issues can be edited' })
  })

  test('applies the same validation as create (empty items)', async () => {
    StockIssue.findByPk.mockResolvedValue({ id: 'i1', status: 'draft' })
    await expect(service.update('i1', { date: '2025-01-01', storeId: 's', items: [] }))
      .rejects.toEqual({ status: 400, message: 'At least one item is required' })
  })

  test('replaces items: destroy-then-recreate within the transaction', async () => {
    StockIssue.findByPk.mockResolvedValue({ id: 'i1', status: 'draft', update: jest.fn().mockResolvedValue() })
    Store.findByPk.mockResolvedValue({ id: 's' })
    await service.update('i1', { date: '2025-01-01', storeId: 's', items: [{ productId: 'p1', qty: 2 }] })
    expect(StockIssueItem.destroy).toHaveBeenCalledWith(expect.objectContaining({ where: { stockIssueId: 'i1' } }))
    expect(StockIssueItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ stockIssueId: 'i1', productId: 'p1', qty: 2 }),
      expect.any(Object),
    )
  })
})

describe('stock-issue.confirm', () => {
  test('throws 404 when missing', async () => {
    StockIssue.findByPk.mockResolvedValue(null)
    await expect(service.confirm('missing')).rejects.toEqual({ status: 404, message: 'Stock Issue not found' })
  })

  test('refuses to confirm an already-confirmed issue', async () => {
    StockIssue.findByPk.mockResolvedValue({ id: 'i1', status: 'confirmed', items: [] })
    await expect(service.confirm('i1')).rejects.toEqual({ status: 400, message: 'Already confirmed' })
  })

  test('refuses when storeId is missing', async () => {
    StockIssue.findByPk.mockResolvedValue({ id: 'i1', status: 'draft', storeId: null, items: [] })
    await expect(service.confirm('i1')).rejects.toEqual({ status: 400, message: 'Store is required before confirming' })
  })

  test('delegates to stock-count.checkStoreLock before mutating', async () => {
    StockIssue.findByPk.mockResolvedValue({ id: 'i1', status: 'draft', storeId: 's1', items: [], update: jest.fn().mockResolvedValue() })
    checkStoreLock.mockRejectedValue({ status: 409, code: 'STORE_STOCK_LOCKED' })
    await expect(service.confirm('i1')).rejects.toMatchObject({ status: 409, code: 'STORE_STOCK_LOCKED' })
    expect(checkStoreLock).toHaveBeenCalledWith('s1')
  })

  test('rejects when store stock is insufficient (rolls back)', async () => {
    StockIssue.findByPk.mockResolvedValue({
      id: 'i1', status: 'draft', storeId: 's1',
      items: [{ productId: 'p1', qty: 5 }],
      update: jest.fn().mockResolvedValue(),
    })
    checkStoreLock.mockResolvedValue()
    Product.findByPk.mockResolvedValue({ id: 'p1', name: 'Widget', stock: '10' })
    StoreStock.findOrCreate.mockResolvedValue([{ stock: 2, update: jest.fn() }]) // 2 available < 5 requested
    await expect(service.confirm('i1')).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('Insufficient stock for "Widget"'),
    })
  })
})

describe('stock-issue.remove', () => {
  test('throws 404 when missing', async () => {
    StockIssue.findByPk.mockResolvedValue(null)
    await expect(service.remove('missing')).rejects.toEqual({ status: 404, message: 'Stock Issue not found' })
  })

  test('refuses to delete a confirmed issue', async () => {
    StockIssue.findByPk.mockResolvedValue({ id: 'i1', status: 'confirmed' })
    await expect(service.remove('i1')).rejects.toEqual({ status: 400, message: 'Cannot delete a confirmed Stock Issue' })
  })

  test('destroys a draft', async () => {
    const issue = { id: 'i1', status: 'draft', destroy: jest.fn().mockResolvedValue() }
    StockIssue.findByPk.mockResolvedValue(issue)
    await service.remove('i1')
    expect(issue.destroy).toHaveBeenCalled()
  })
})
