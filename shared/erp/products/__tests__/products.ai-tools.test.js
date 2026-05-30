// Unit tests for the Products AI tool handlers. The handlers lazily `require`
// the product + product-category services, so we mock those module paths and
// drive each tool's handler directly with a fake user ctx.
jest.mock('../services/product.service', () => ({
  list: jest.fn(), getById: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn(),
}))
jest.mock('../services/product-category.service', () => ({
  list: jest.fn(), listAll: jest.fn(), create: jest.fn(),
}))

const productSvc = require('../services/product.service')
const categorySvc = require('../services/product-category.service')
const { tools, navTargets } = require('../ai-tools')

const USER = { id: 'u1', organizationId: 'o1' }
const ctx  = { user: USER }
const byName = Object.fromEntries(tools.map((t) => [t.name, t]))

beforeEach(() => jest.clearAllMocks())

describe('products ai-tools — registry', () => {
  test('exposes the full toolset and nav targets', () => {
    expect(Object.keys(byName).sort()).toEqual([
      'create_product', 'create_product_category', 'delete_product',
      'get_product', 'list_product_categories', 'list_products', 'update_product',
    ])
    expect(navTargets).toHaveProperty('products_list')
    expect(navTargets).toHaveProperty('product_categories_list')
  })

  test('every tool is server-kind with a handler', () => {
    for (const t of tools) {
      expect(t.kind).toBe('server')
      expect(typeof t.handler).toBe('function')
      expect(t.parameters.type).toBe('object')
    }
  })
})

describe('create_product', () => {
  test('auto-codes when no sku is given', async () => {
    productSvc.create.mockResolvedValue({ id: 'p1', name: 'Widget', sku: 'PRD-1' })
    const { result, action } = await byName.create_product.handler({ name: 'Widget', cost: 5 }, ctx)
    expect(productSvc.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Widget', autoCode: true, cost: 5, userId: 'u1', organizationId: 'o1',
    }))
    expect(result).toMatchObject({ id: 'p1', sku: 'PRD-1' })
    expect(action.path).toBe('/erp/item-master/p1/edit')
  })

  test('keeps an explicit sku (autoCode false)', async () => {
    productSvc.create.mockResolvedValue({ id: 'p2', name: 'Gadget', sku: 'G-9' })
    await byName.create_product.handler({ name: 'Gadget', sku: 'G-9' }, ctx)
    expect(productSvc.create).toHaveBeenCalledWith(expect.objectContaining({ sku: 'G-9', autoCode: false }))
  })
})

describe('list_products', () => {
  test('passes filters and clamps the limit', async () => {
    productSvc.list.mockResolvedValue({ total: 1, products: [{ id: 'p1', name: 'Widget', sku: 'PRD-1', stock: 3 }] })
    const { result, action } = await byName.list_products.handler({ search: 'wid', status: 'active', limit: 999 }, ctx)
    expect(productSvc.list).toHaveBeenCalledWith(expect.objectContaining({
      search: 'wid', status: 'active', limit: 50, organizationId: 'o1',
    }))
    expect(result.products[0]).toMatchObject({ name: 'Widget', stock: 3 })
    expect(action.path).toBe('/erp/item-master')
  })
})

describe('get_product — resolution', () => {
  test('returns full detail on a unique match', async () => {
    productSvc.list.mockResolvedValue({ products: [{ id: 'p1', name: 'Widget', sku: 'PRD-1', description: 'd', reorderPoint: 2, reorderQty: 10 }] })
    const { result, action } = await byName.get_product.handler({ search: 'Widget' }, ctx)
    expect(result).toMatchObject({ id: 'p1', description: 'd', reorderPoint: 2, reorderQty: 10 })
    expect(action.path).toBe('/erp/item-master/p1/edit')
  })

  test('reports when nothing matches', async () => {
    productSvc.list.mockResolvedValue({ products: [] })
    const { result, action } = await byName.get_product.handler({ search: 'ghost' }, ctx)
    expect(result).toMatch(/No product matches/)
    expect(action).toBeUndefined()
  })

  test('disambiguates by exact name, else asks to narrow', async () => {
    productSvc.list.mockResolvedValue({ products: [
      { id: 'p1', name: 'Widget', sku: 'PRD-1' },
      { id: 'p2', name: 'Widget Pro', sku: 'PRD-2' },
    ] })
    const exact = await byName.get_product.handler({ search: 'widget' }, ctx)
    expect(exact.result).toMatchObject({ id: 'p1' })

    productSvc.list.mockResolvedValue({ products: [
      { id: 'p1', name: 'Widget One', sku: 'PRD-1' },
      { id: 'p2', name: 'Widget Two', sku: 'PRD-2' },
    ] })
    const ambiguous = await byName.get_product.handler({ search: 'widget' }, ctx)
    expect(ambiguous.result).toMatch(/Multiple products match/)
  })
})

describe('update_product', () => {
  test('updates only passed fields', async () => {
    productSvc.list.mockResolvedValue({ products: [{ id: 'p1', name: 'Widget', sku: 'PRD-1' }] })
    productSvc.update.mockResolvedValue({ id: 'p1', name: 'Widget', sku: 'PRD-1' })
    const { result } = await byName.update_product.handler({ search: 'PRD-1', cost: 9, status: 'inactive' }, ctx)
    expect(productSvc.update).toHaveBeenCalledWith('p1', { cost: 9, status: 'inactive' }, 'u1', 'o1')
    expect(result.updated).toEqual(expect.arrayContaining(['cost', 'status']))
  })

  test('no fields → does not call update', async () => {
    productSvc.list.mockResolvedValue({ products: [{ id: 'p1', name: 'Widget' }] })
    const { result } = await byName.update_product.handler({ search: 'Widget' }, ctx)
    expect(productSvc.update).not.toHaveBeenCalled()
    expect(result).toMatch(/Nothing to update/)
  })
})

describe('delete_product', () => {
  test('removes a uniquely-resolved product', async () => {
    productSvc.list.mockResolvedValue({ products: [{ id: 'p1', name: 'Widget', sku: 'PRD-1' }] })
    productSvc.remove.mockResolvedValue()
    const { result, action } = await byName.delete_product.handler({ search: 'Widget' }, ctx)
    expect(productSvc.remove).toHaveBeenCalledWith('p1', 'o1')
    expect(result).toMatch(/Deleted product Widget \(PRD-1\)/)
    expect(action.path).toBe('/erp/item-master')
  })

  test('does not delete when ambiguous', async () => {
    productSvc.list.mockResolvedValue({ products: [
      { id: 'p1', name: 'Widget One' }, { id: 'p2', name: 'Widget Two' },
    ] })
    const { result } = await byName.delete_product.handler({ search: 'widget' }, ctx)
    expect(productSvc.remove).not.toHaveBeenCalled()
    expect(result).toMatch(/Multiple products match/)
  })
})

describe('product categories', () => {
  test('create_product_category auto-codes and resolves a parent name', async () => {
    categorySvc.listAll.mockResolvedValue([{ id: 'c0', name: 'Hardware' }])
    categorySvc.create.mockResolvedValue({ id: 'c1', name: 'Tools', code: 'CAT-1' })
    const { result, action } = await byName.create_product_category.handler({ name: 'Tools', parent: 'hardware' }, ctx)
    expect(categorySvc.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Tools', autoCode: true, parentId: 'c0',
    }))
    expect(result).toMatchObject({ code: 'CAT-1' })
    expect(action.path).toBe('/erp/product-categories/c1/edit')
  })

  test('unknown parent resolves to null', async () => {
    categorySvc.listAll.mockResolvedValue([])
    categorySvc.create.mockResolvedValue({ id: 'c2', name: 'Misc', code: 'CAT-2' })
    await byName.create_product_category.handler({ name: 'Misc', parent: 'nope' }, ctx)
    expect(categorySvc.create).toHaveBeenCalledWith(expect.objectContaining({ parentId: null }))
  })

  test('list_product_categories returns slim rows with parent name', async () => {
    categorySvc.list.mockResolvedValue({ total: 1, categories: [{ id: 'c1', name: 'Tools', code: 'CAT-1', parent: { name: 'Hardware' }, status: 'active' }] })
    const { result, action } = await byName.list_product_categories.handler({}, ctx)
    expect(result.categories[0]).toMatchObject({ name: 'Tools', parent: 'Hardware' })
    expect(action.path).toBe('/erp/product-categories')
  })
})
