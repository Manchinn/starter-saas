// Unit tests for stock/stock-movement.service.
//
// A read-only ledger view: the only function is list(), so all the behaviour
// is query shaping — pagination math, the three optional filters that are
// only applied when truthy, the product/store eager-loads, distinct, and the
// {total,page,limit,movements} envelope.

jest.mock('../../../../../server/models', () => ({
  StockMovement: { findAndCountAll: jest.fn() },
  Product:       {},
  Store:         {},
}))

const { StockMovement } = require('../../../../../server/models')
const service = require('../stock-movement.service')

describe('stock-movement.list', () => {
  beforeEach(() => {
    StockMovement.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
  })

  test('defaults: page 1 / limit 20, no filters, newest first, eager-loads + distinct', async () => {
    StockMovement.findAndCountAll.mockResolvedValueOnce({ count: 5, rows: [{ id: 'm1' }] })
    const out = await service.list({})
    expect(out).toEqual({ total: 5, page: 1, limit: 20, movements: [{ id: 'm1' }] })
    const args = StockMovement.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(0)
    expect(args.limit).toBe(20)
    expect(args.where).toEqual({}) // no filters supplied
    expect(args.order).toEqual([['createdAt', 'DESC']])
    expect(args.distinct).toBe(true)
    expect(args.include[0]).toMatchObject({ as: 'product' })
    expect(args.include[1]).toMatchObject({ as: 'store' })
  })

  test('computes offset from page/limit', async () => {
    await service.list({ page: 3, limit: 10 })
    expect(StockMovement.findAndCountAll.mock.calls[0][0].offset).toBe(20) // (3-1)*10
  })

  test('applies productId / storeId / type filters when provided', async () => {
    await service.list({ productId: 'p1', storeId: 's1', type: 'issue' })
    expect(StockMovement.findAndCountAll.mock.calls[0][0].where).toEqual({
      productId: 'p1', storeId: 's1', type: 'issue',
    })
  })

  test('omits a filter key entirely when its value is falsy', async () => {
    await service.list({ productId: 'p1', storeId: '', type: '' })
    expect(StockMovement.findAndCountAll.mock.calls[0][0].where).toEqual({ productId: 'p1' })
  })
})
