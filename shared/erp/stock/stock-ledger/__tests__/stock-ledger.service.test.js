// Unit tests for stock-ledger.postDelta — the public write surface for stock deltas.
// Interface = test surface (issue #1). Mocks models only; no real DB.

jest.mock('../../../../../server/models', () => ({
  Product:       { findByPk: jest.fn() },
  StoreStock:    { findOrCreate: jest.fn() },
  StockMovement: { create: jest.fn() },
}))

const { Product, StoreStock, StockMovement } = require('../../../../../server/models')
const { postDelta } = require('../stock-ledger.service')

const txn = { id: 't1' }

beforeEach(() => {
  jest.clearAllMocks()
  StockMovement.create.mockImplementation(async (row) => ({ id: 'm1', ...row }))
})

describe('stock-ledger.postDelta — input guards', () => {
  test('requires organizationId key (null is allowed)', async () => {
    await expect(postDelta({
      productId: 'p1', qty: 1, type: 'adjust', transaction: txn,
    })).rejects.toEqual({ status: 400, message: 'organizationId is required (may be null)' })
  })

  test('requires transaction', async () => {
    await expect(postDelta({
      productId: 'p1', qty: 1, type: 'adjust', organizationId: null,
    })).rejects.toEqual({ status: 400, message: 'transaction is required' })
  })

  test('requires productId', async () => {
    await expect(postDelta({
      qty: 1, type: 'adjust', organizationId: null, transaction: txn,
    })).rejects.toEqual({ status: 400, message: 'productId is required' })
  })

  test('requires qty', async () => {
    await expect(postDelta({
      productId: 'p1', type: 'adjust', organizationId: null, transaction: txn,
    })).rejects.toEqual({ status: 400, message: 'qty is required' })
  })

  test('requires type', async () => {
    await expect(postDelta({
      productId: 'p1', qty: 1, organizationId: null, transaction: txn,
    })).rejects.toEqual({ status: 400, message: 'type is required' })
  })
})

describe('stock-ledger.postDelta — product + movement only (storeId null)', () => {
  test('updates product stock and writes movement; skips StoreStock', async () => {
    const product = { stock: 10, update: jest.fn().mockResolvedValue() }
    Product.findByPk.mockResolvedValue(product)

    const out = await postDelta({
      productId: 'p1',
      storeId: null,
      qty: 5,
      type: 'adjust',
      refType: 'StockAdjust',
      refId: 'a1',
      refNo: 'ADJ-1',
      notes: 'bump',
      organizationId: 'org-1',
      transaction: txn,
    })

    expect(product.update).toHaveBeenCalledWith({ stock: 15 }, { transaction: txn })
    expect(StoreStock.findOrCreate).not.toHaveBeenCalled()
    expect(StockMovement.create).toHaveBeenCalledWith({
      productId: 'p1',
      storeId: null,
      type: 'adjust',
      qty: 5,
      stockBefore: 10,
      stockAfter: 15,
      refType: 'StockAdjust',
      refId: 'a1',
      refNo: 'ADJ-1',
      notes: 'bump',
      organizationId: 'org-1',
    }, { transaction: txn })
    expect(out).toMatchObject({ stockBefore: 10, stockAfter: 15 })
    expect(out.movement).toMatchObject({ type: 'adjust', qty: 5 })
  })
})

describe('stock-ledger.postDelta — product + StoreStock + movement', () => {
  test('updates store row when storeId provided', async () => {
    const product = { stock: '20', update: jest.fn().mockResolvedValue() }
    Product.findByPk.mockResolvedValue(product)
    const storeStock = { stock: '7', update: jest.fn().mockResolvedValue() }
    StoreStock.findOrCreate.mockResolvedValue([storeStock])

    const out = await postDelta({
      productId: 'p1',
      storeId: 's1',
      qty: -3,
      type: 'issue',
      refType: 'StockIssue',
      refId: 'i1',
      refNo: 'ISS-1',
      organizationId: null,
      transaction: txn,
    })

    expect(product.update).toHaveBeenCalledWith({ stock: 17 }, { transaction: txn })
    expect(StoreStock.findOrCreate).toHaveBeenCalledWith({
      where: { productId: 'p1', storeId: 's1' },
      defaults: { stock: 0 },
      transaction: txn,
    })
    expect(storeStock.update).toHaveBeenCalledWith({ stock: 4 }, { transaction: txn })
    expect(out).toEqual(expect.objectContaining({ stockBefore: 20, stockAfter: 17 }))
    expect(StockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: 's1',
        type: 'issue',
        qty: -3,
        stockBefore: 20,
        stockAfter: 17,
        organizationId: null,
      }),
      { transaction: txn },
    )
  })
})

describe('stock-ledger.postDelta — signed qty', () => {
  test('positive qty increases product-level before/after', async () => {
    const product = { stock: 0, update: jest.fn().mockResolvedValue() }
    Product.findByPk.mockResolvedValue(product)

    const out = await postDelta({
      productId: 'p1', qty: 12, type: 'receive', organizationId: null, transaction: txn,
    })
    expect(out.stockBefore).toBe(0)
    expect(out.stockAfter).toBe(12)
  })

  test('negative qty decreases product-level before/after (no negative enforcement)', async () => {
    const product = { stock: 2, update: jest.fn().mockResolvedValue() }
    Product.findByPk.mockResolvedValue(product)

    const out = await postDelta({
      productId: 'p1', qty: -10, type: 'sale', organizationId: null, transaction: txn,
    })
    expect(out.stockBefore).toBe(2)
    expect(out.stockAfter).toBe(-8)
    expect(product.update).toHaveBeenCalledWith({ stock: -8 }, { transaction: txn })
  })
})

describe('stock-ledger.postDelta — missing product (E1)', () => {
  test('throws when product is not found', async () => {
    Product.findByPk.mockResolvedValue(null)
    await expect(postDelta({
      productId: 'missing',
      qty: 1,
      type: 'adjust',
      organizationId: null,
      transaction: txn,
    })).rejects.toEqual({ status: 404, message: 'Product not found' })
    expect(StockMovement.create).not.toHaveBeenCalled()
  })
})

describe('stock-ledger.postDelta — participates in caller transaction', () => {
  test('passes the same transaction object to all model ops', async () => {
    const product = { stock: 1, update: jest.fn().mockResolvedValue() }
    Product.findByPk.mockResolvedValue(product)
    StoreStock.findOrCreate.mockResolvedValue([{ stock: 0, update: jest.fn().mockResolvedValue() }])

    await postDelta({
      productId: 'p1',
      storeId: 's1',
      qty: 1,
      type: 'adjust',
      organizationId: null,
      transaction: txn,
    })

    expect(Product.findByPk).toHaveBeenCalledWith('p1', { transaction: txn })
    expect(product.update).toHaveBeenCalledWith(expect.anything(), { transaction: txn })
    expect(StoreStock.findOrCreate).toHaveBeenCalledWith(expect.objectContaining({ transaction: txn }))
    expect(StockMovement.create).toHaveBeenCalledWith(expect.anything(), { transaction: txn })
  })
})
