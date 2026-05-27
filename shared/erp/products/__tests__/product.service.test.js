// Unit tests for product.service.
//
// Product queries eager-load Store/Vendor/UOM associations, and create/update
// also call setStores/setVendors on the row instance. We mock everything at
// the model facade so the test never touches a database.

jest.mock('../../../../server/models', () => ({
  Product:    { findAndCountAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  Store:      { findAll: jest.fn() },
  UOM:        {},
  StoreStock: { findAll: jest.fn() },
  Vendor:     {},
}))

jest.mock('../../settings/services/sequence.service', () => ({
  getNext: jest.fn(),
}), { virtual: true })

const { Op } = require('sequelize')
const { Product, Store, StoreStock } = require('../../../../server/models')
const seqSvc = require('../../settings/services/sequence.service')
const service = require('../services/product.service')

describe('product.service.list', () => {
  beforeEach(() => {
    Product.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
  })

  test('paginates and returns { total, page, limit, products }', async () => {
    Product.findAndCountAll.mockResolvedValueOnce({ count: 9, rows: [{ id: 'p1' }] })
    const out = await service.list({ page: 3, limit: 3, organizationId: 'org-1' })
    expect(out).toEqual({ total: 9, page: 3, limit: 3, products: [{ id: 'p1' }] })

    const args = Product.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(6)
    expect(args.where.organizationId).toBe('org-1')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.order).toEqual([['createdAt', 'DESC']])
    expect(args.distinct).toBe(true) // crucial — joined includes would inflate count without this
  })

  test('search filters across name, sku, and category', async () => {
    await service.list({ search: 'widget', organizationId: 'org-1' })
    const or = Product.findAndCountAll.mock.calls[0][0].where[Op.or]
    expect(or).toHaveLength(3)
    expect(or[0].name[Op.like]).toBe('%widget%')
    expect(or[1].sku[Op.like]).toBe('%widget%')
    expect(or[2].category[Op.like]).toBe('%widget%')
  })

  test('eager-loads stores, vendors, sellingUom, and purchasingUom', async () => {
    await service.list({})
    const includes = Product.findAndCountAll.mock.calls[0][0].include
    const aliases = includes.map(i => i.as).sort()
    expect(aliases).toEqual(['purchasingUom', 'sellingUom', 'stores', 'vendors'])
  })

  test('applies createdBy/status/active range when supplied', async () => {
    await service.list({
      createdBy: 'u1',
      status: 'active',
      activeFrom: '2025-01-01',
      activeTo: '2025-12-31',
      organizationId: 'org-1',
    })
    const w = Product.findAndCountAll.mock.calls[0][0].where
    expect(w.createdBy).toBe('u1')
    expect(w.status).toBe('active')
    expect(w.activeFrom[Op.gte]).toBe('2025-01-01')
    expect(w.activeTo[Op.lte]).toBe('2025-12-31')
  })
})

describe('product.service.getById', () => {
  test('returns the product with associations when found', async () => {
    Product.findByPk.mockResolvedValue({ id: 'p1', name: 'Widget' })
    await expect(service.getById('p1')).resolves.toEqual({ id: 'p1', name: 'Widget' })
    expect(Product.findByPk).toHaveBeenCalledWith('p1', expect.objectContaining({
      include: expect.any(Array),
    }))
  })

  test('throws 404 when missing', async () => {
    Product.findByPk.mockResolvedValue(null)
    await expect(service.getById('missing')).rejects.toEqual({ status: 404, message: 'Product not found' })
  })
})

describe('product.service.create', () => {
  test('rejects blank names', async () => {
    await expect(service.create({ name: '   ' })).rejects.toEqual({ status: 400, message: 'Name is required' })
    expect(Product.create).not.toHaveBeenCalled()
  })

  test('uses the PRD sequence when autoCode is true', async () => {
    seqSvc.getNext.mockResolvedValue('PRD-0007')
    Product.create.mockResolvedValue({ id: 'new', setStores: jest.fn(), setVendors: jest.fn() })
    Product.findByPk.mockResolvedValue({ id: 'new' }) // for the trailing getById call
    await service.create({ name: 'Widget', autoCode: true, userId: 'u1' })
    expect(seqSvc.getNext).toHaveBeenCalledWith('PRD', 'u1')
    expect(Product.create.mock.calls[0][0].sku).toBe('PRD-0007')
  })

  test('duplicate SKU check is scoped to the same creator (not the org)', async () => {
    Product.findOne.mockResolvedValue({ id: 'dup' })
    await expect(service.create({ name: 'Widget', sku: 'W-1', userId: 'u1' }))
      .rejects.toEqual({ status: 400, message: 'SKU already exists' })
    expect(Product.findOne).toHaveBeenCalledWith({ where: { sku: 'W-1', createdBy: 'u1' } })
    expect(Product.create).not.toHaveBeenCalled()
  })

  test('persists price=0 and stock=0 by default, trims name + sku, coerces reorder fields', async () => {
    Product.findOne.mockResolvedValue(null)
    const productInstance = { id: 'new', setStores: jest.fn(), setVendors: jest.fn() }
    Product.create.mockResolvedValue(productInstance)
    Product.findByPk.mockResolvedValue({ id: 'new' })
    await service.create({
      name: '  Widget  ',
      sku: '  W-9  ',
      reorderPoint: '',     // empty string → null
      reorderQty: 0,        // numeric zero → kept
      activeFrom: '',
      activeTo: '',
      userId: 'u1',
      organizationId: 'org-1',
    })
    const payload = Product.create.mock.calls[0][0]
    expect(payload.name).toBe('Widget')
    expect(payload.sku).toBe('W-9')
    expect(payload.price).toBe(0)
    expect(payload.stock).toBe(0)
    expect(payload.reorderPoint).toBeNull()
    expect(payload.reorderQty).toBe(0)
    expect(payload.activeFrom).toBeNull()
    expect(payload.activeTo).toBeNull()
    expect(payload.organizationId).toBe('org-1')
    expect(payload.createdBy).toBe('u1')
  })

  test('associates stores and vendors only when arrays are provided', async () => {
    Product.findOne.mockResolvedValue(null)
    const productInstance = { id: 'new', setStores: jest.fn(), setVendors: jest.fn() }
    Product.create.mockResolvedValue(productInstance)
    Product.findByPk.mockResolvedValue({ id: 'new' })

    // empty arrays → no calls
    await service.create({ name: 'A' })
    expect(productInstance.setStores).not.toHaveBeenCalled()
    expect(productInstance.setVendors).not.toHaveBeenCalled()

    // non-empty arrays → both called
    productInstance.setStores.mockClear()
    productInstance.setVendors.mockClear()
    await service.create({ name: 'B', storeIds: ['s1', 's2'], vendorIds: ['v1'] })
    expect(productInstance.setStores).toHaveBeenCalledWith(['s1', 's2'])
    expect(productInstance.setVendors).toHaveBeenCalledWith(['v1'])
  })

  test('re-reads via getById so the caller sees populated associations', async () => {
    Product.findOne.mockResolvedValue(null)
    Product.create.mockResolvedValue({ id: 'new', setStores: jest.fn(), setVendors: jest.fn() })
    Product.findByPk.mockResolvedValue({ id: 'new', stores: [], vendors: [] })
    const out = await service.create({ name: 'Widget' })
    expect(out).toEqual({ id: 'new', stores: [], vendors: [] })
    expect(Product.findByPk).toHaveBeenCalled()
  })
})

describe('product.service.update', () => {
  test('throws 404 when missing', async () => {
    Product.findByPk.mockResolvedValue(null)
    await expect(service.update('missing', { name: 'x' })).rejects.toEqual({ status: 404, message: 'Product not found' })
  })

  test('rejects SKU collision with another product from the same creator', async () => {
    const product = { id: 'p1', createdBy: 'u-creator', update: jest.fn() }
    Product.findByPk.mockResolvedValue(product)
    Product.findOne.mockResolvedValue({ id: 'p2' })
    await expect(service.update('p1', { sku: 'DUP' }, 'u2'))
      .rejects.toEqual({ status: 400, message: 'SKU already exists' })
    expect(Product.findOne).toHaveBeenCalledWith({ where: { sku: 'DUP', createdBy: 'u-creator' } })
    expect(product.update).not.toHaveBeenCalled()
  })

  test('allows re-saving the same product with its own SKU', async () => {
    const product = {
      id: 'p1', createdBy: 'u-creator',
      update: jest.fn().mockResolvedValue(),
      setStores: jest.fn(), setVendors: jest.fn(),
    }
    Product.findByPk
      .mockResolvedValueOnce(product)
      .mockResolvedValueOnce({ id: 'p1' }) // trailing getById
    Product.findOne.mockResolvedValue({ id: 'p1' }) // self
    await service.update('p1', { sku: 'SAME' }, 'u2')
    expect(product.update).toHaveBeenCalled()
  })

  test('filters disallowed fields and coerces empty string for reorder fields', async () => {
    const product = {
      id: 'p1', createdBy: 'u-creator',
      update: jest.fn().mockResolvedValue(),
      setStores: jest.fn(), setVendors: jest.fn(),
    }
    Product.findByPk
      .mockResolvedValueOnce(product)
      .mockResolvedValueOnce({ id: 'p1', name: 'New' })
    const out = await service.update('p1', {
      name: 'New',
      stock: 999,                 // not allowed
      reorderPoint: '',
      reorderQty: 0,              // zero stays
      activeFrom: '',
      organizationId: 'attack',   // not allowed
    }, 'u2')
    const patch = product.update.mock.calls[0][0]
    expect(patch.name).toBe('New')
    expect(patch.reorderPoint).toBeNull()
    expect(patch.reorderQty).toBe(0)
    expect(patch.activeFrom).toBeNull()
    expect(patch.modifiedBy).toBe('u2')
    expect(patch).not.toHaveProperty('stock')
    expect(patch).not.toHaveProperty('organizationId')
    expect(out).toEqual({ id: 'p1', name: 'New' })
  })

  test('replaces store/vendor associations only when arrays are supplied', async () => {
    const product = {
      id: 'p1', createdBy: 'u',
      update: jest.fn().mockResolvedValue(),
      setStores: jest.fn(), setVendors: jest.fn(),
    }
    Product.findByPk
      .mockResolvedValueOnce(product)
      .mockResolvedValueOnce({ id: 'p1' })
    await service.update('p1', { name: 'X' }, 'u2')
    expect(product.setStores).not.toHaveBeenCalled()
    expect(product.setVendors).not.toHaveBeenCalled()

    // Explicit empty array → set to [] (clears associations)
    product.setStores.mockClear()
    product.setVendors.mockClear()
    Product.findByPk
      .mockResolvedValueOnce(product)
      .mockResolvedValueOnce({ id: 'p1' })
    await service.update('p1', { storeIds: [], vendorIds: ['v1'] }, 'u2')
    expect(product.setStores).toHaveBeenCalledWith([])
    expect(product.setVendors).toHaveBeenCalledWith(['v1'])
  })
})

describe('product.service.remove', () => {
  test('throws 404 when missing', async () => {
    Product.findByPk.mockResolvedValue(null)
    await expect(service.remove('missing')).rejects.toEqual({ status: 404, message: 'Product not found' })
  })

  test('blocks deletion when stock on hand is greater than zero', async () => {
    const product = { id: 'p1', name: 'Widget', stock: 5, destroy: jest.fn() }
    Product.findByPk.mockResolvedValue(product)
    await expect(service.remove('p1')).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('5 unit(s) on hand'),
    })
    expect(product.destroy).not.toHaveBeenCalled()
  })

  test('destroys when stock is zero', async () => {
    const product = { id: 'p1', name: 'Widget', stock: 0, destroy: jest.fn().mockResolvedValue() }
    Product.findByPk.mockResolvedValue(product)
    await service.remove('p1')
    expect(product.destroy).toHaveBeenCalled()
  })
})

describe('product.service.listStores', () => {
  test('returns active stores ordered by name with minimal attributes', async () => {
    Store.findAll.mockResolvedValue([{ id: 's1' }])
    await expect(service.listStores()).resolves.toEqual([{ id: 's1' }])
    expect(Store.findAll).toHaveBeenCalledWith({
      where: { status: 'active' },
      attributes: ['id', 'name', 'code'],
      order: [['name', 'ASC']],
    })
  })
})

describe('product.service.listStoreStocks', () => {
  test('throws 404 when product is missing', async () => {
    Product.findByPk.mockResolvedValue(null)
    await expect(service.listStoreStocks('missing')).rejects.toEqual({ status: 404, message: 'Product not found' })
  })

  test('returns { totalStock, storeStocks } with the store eager-loaded', async () => {
    Product.findByPk.mockResolvedValue({ id: 'p1', stock: 42 })
    StoreStock.findAll.mockResolvedValue([{ storeId: 's1', stock: 30 }, { storeId: 's2', stock: 12 }])
    const out = await service.listStoreStocks('p1')
    expect(out.totalStock).toBe(42)
    expect(out.storeStocks).toHaveLength(2)

    const callArgs = StoreStock.findAll.mock.calls[0][0]
    expect(callArgs.where).toEqual({ productId: 'p1' })
    expect(callArgs.include[0]).toMatchObject({ as: 'store', attributes: ['id', 'name', 'code'] })
  })
})
