// Unit tests for stock/stock-balance.service.
//
// This service is read-only (no transactions, no audit). The interesting
// behaviour is all in query shaping and post-query math: the includeZero
// rule on `list`, the active-only filter on `lookups`, the WAC valuation
// (qty * product.cost) and the null-safety when a product or its cost is
// missing. We let the real toFixed run since it's a pure util.

jest.mock('../../../../../server/models', () => ({
  StoreStock:    { findAll: jest.fn() },
  Product:       { findAll: jest.fn(), findByPk: jest.fn() },
  Store:         { findAll: jest.fn() },
  UOM:           {},
  StockMovement: { findAll: jest.fn() },
}))

const { Op } = require('sequelize')
const { StoreStock, Product, Store, StockMovement } = require('../../../../../server/models')
const service = require('../stock-balance.service')

describe('stock-balance.list — query shaping', () => {
  beforeEach(() => {
    StoreStock.findAll.mockResolvedValue([])
  })

  test('default excludes zero stock via Op.gt: 0, no store/product filter', async () => {
    await service.list({})
    const where = StoreStock.findAll.mock.calls[0][0].where
    expect(where.stock[Op.gt]).toBe(0)
    expect(where.storeId).toBeUndefined()
    expect(where.productId).toBeUndefined()
  })

  test('includeZero: true drops the stock filter entirely', async () => {
    await service.list({ includeZero: true })
    const where = StoreStock.findAll.mock.calls[0][0].where
    expect(where.stock).toBeUndefined()
  })

  test('storeId and productId narrow the where clause', async () => {
    await service.list({ storeId: 's1', productId: 'p1' })
    const where = StoreStock.findAll.mock.calls[0][0].where
    expect(where.storeId).toBe('s1')
    expect(where.productId).toBe('p1')
  })

  test('eager-loads store and product (with nested sellingUom)', async () => {
    await service.list({})
    const include = StoreStock.findAll.mock.calls[0][0].include
    expect(include[0]).toMatchObject({ as: 'store' })
    expect(include[1]).toMatchObject({ as: 'product' })
    expect(include[1].include[0]).toMatchObject({ as: 'sellingUom' })
  })
})

describe('stock-balance.list — valuation mapping', () => {
  test('computes qty, wac and value = qty * cost, surfaces uom from product', async () => {
    StoreStock.findAll.mockResolvedValue([{
      id: 'ss1',
      stock: '3.5',
      store: { id: 's1', name: 'Main' },
      product: { id: 'p1', name: 'Widget', cost: '10.50', sellingUom: { id: 'u1', name: 'Each' } },
    }])
    const [row] = await service.list({})
    expect(row).toMatchObject({
      id: 'ss1',
      qty: 3.5,
      wac: 10.5,
      value: 36.75,            // 3.5 * 10.5
      uom: { id: 'u1', name: 'Each' },
      store: { id: 's1', name: 'Main' },
    })
  })

  test('missing product cost → wac 0, value 0, uom null', async () => {
    StoreStock.findAll.mockResolvedValue([{
      id: 'ss2',
      stock: '5',
      store: { id: 's1' },
      product: { id: 'p2', name: 'NoCost' }, // no cost, no sellingUom
    }])
    const [row] = await service.list({})
    expect(row.wac).toBe(0)
    expect(row.value).toBe(0)
    expect(row.uom).toBeNull()
  })

  test('missing product entirely → wac 0, uom null (no throw)', async () => {
    StoreStock.findAll.mockResolvedValue([{ id: 'ss3', stock: '2', store: { id: 's1' }, product: null }])
    const [row] = await service.list({})
    expect(row.qty).toBe(2)
    expect(row.wac).toBe(0)
    expect(row.uom).toBeNull()
  })
})

describe('stock-balance.lookups', () => {
  test('returns stores and active-only products', async () => {
    Store.findAll.mockResolvedValue([{ id: 's1', name: 'Main' }])
    Product.findAll.mockResolvedValue([{ id: 'p1', name: 'Widget' }])
    const out = await service.lookups()
    expect(out).toEqual({ stores: [{ id: 's1', name: 'Main' }], products: [{ id: 'p1', name: 'Widget' }] })
    expect(Product.findAll.mock.calls[0][0].where).toEqual({ status: 'active' })
  })
})

describe('stock-balance.getProductSummary', () => {
  test('throws 404 when the product is missing', async () => {
    Product.findByPk.mockResolvedValue(null)
    await expect(service.getProductSummary('missing'))
      .rejects.toEqual({ status: 404, message: 'Product not found' })
  })

  test('aggregates totalStock across stores and values it at product cost', async () => {
    Product.findByPk.mockResolvedValue({ id: 'p1', name: 'Widget', cost: '10' })
    StoreStock.findAll.mockResolvedValue([{ stock: '4' }, { stock: '6.5' }])
    StockMovement.findAll.mockResolvedValue([{ id: 'm1' }])

    const out = await service.getProductSummary('p1')
    expect(out.totalStock).toBe(10.5)        // 4 + 6.5
    expect(out.totalValue).toBe(105)         // 10.5 * 10
    expect(out.product).toMatchObject({ id: 'p1' })
    expect(out.movements).toEqual([{ id: 'm1' }])
  })

  test('caps recent movements at 20, newest first', async () => {
    Product.findByPk.mockResolvedValue({ id: 'p1', cost: '1' })
    StoreStock.findAll.mockResolvedValue([])
    StockMovement.findAll.mockResolvedValue([])
    await service.getProductSummary('p1')
    const args = StockMovement.findAll.mock.calls[0][0]
    expect(args.limit).toBe(20)
    expect(args.order).toEqual([['createdAt', 'DESC']])
    expect(args.where).toEqual({ productId: 'p1' })
  })
})
