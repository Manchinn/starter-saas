// Unit tests for the Sale AI tool handlers (sale items + sale packages).
// Handlers lazily `require` their services and the products resolver, so we
// mock those module paths and drive each tool's handler directly.
jest.mock('../services/sale-item.service', () => ({
  list: jest.fn(), getById: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn(),
}))
jest.mock('../services/sale-package.service', () => ({
  list: jest.fn(), getById: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn(),
}))
jest.mock('../../products/ai-tools/product.ai-tools', () => ({
  resolveProduct: jest.fn(),
}))

const saleItemSvc = require('../services/sale-item.service')
const pkgSvc      = require('../services/sale-package.service')
const { resolveProduct } = require('../../products/ai-tools/product.ai-tools')
const { tools, navTargets } = require('../ai-tools')

const USER = { id: 'u1', organizationId: 'o1' }
const ctx  = { user: USER }
const byName = Object.fromEntries(tools.map((t) => [t.name, t]))

beforeEach(() => jest.clearAllMocks())

describe('sale ai-tools — registry', () => {
  test('exposes the full toolset and nav targets', () => {
    expect(Object.keys(byName).sort()).toEqual([
      'create_sale_item', 'create_sale_package',
      'delete_sale_item', 'delete_sale_package',
      'get_sale_item', 'get_sale_package',
      'list_sale_items', 'list_sale_packages',
      'update_sale_item', 'update_sale_package',
    ])
    for (const key of ['sale_items_list', 'sale_packages_list']) {
      expect(navTargets).toHaveProperty(key)
    }
  })

  test('every tool is server-kind with a handler and object params', () => {
    for (const t of tools) {
      expect(t.kind).toBe('server')
      expect(typeof t.handler).toBe('function')
      expect(t.parameters.type).toBe('object')
    }
  })
})

describe('sale items', () => {
  test('create auto-codes and resolves the optional product', async () => {
    resolveProduct.mockResolvedValue({ product: { id: 'pr1', name: 'Widget' } })
    saleItemSvc.create.mockResolvedValue({ id: 'si1', name: 'Widget Sale', code: 'SI-1' })
    const { result, action } = await byName.create_sale_item.handler({ name: 'Widget Sale', product: 'Widget' }, ctx)
    expect(saleItemSvc.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Widget Sale', autoCode: true, productId: 'pr1', organizationId: 'o1',
    }))
    expect(result).toMatchObject({ id: 'si1', code: 'SI-1' })
    expect(action.path).toBe('/erp/sale-items/si1/edit')
  })

  test('create surfaces an unknown product error without creating', async () => {
    resolveProduct.mockResolvedValue({ error: 'No product matches "ghost".' })
    const { result } = await byName.create_sale_item.handler({ name: 'X', product: 'ghost' }, ctx)
    expect(result).toMatch(/No product matches/)
    expect(saleItemSvc.create).not.toHaveBeenCalled()
  })

  test('update can unlink the product with an empty string', async () => {
    saleItemSvc.list.mockResolvedValue({ items: [{ id: 'si1', name: 'Widget Sale', code: 'SI-1' }] })
    saleItemSvc.update.mockResolvedValue({ id: 'si1', name: 'Widget Sale', code: 'SI-1' })
    const { result } = await byName.update_sale_item.handler({ search: 'SI-1', product: '' }, ctx)
    expect(saleItemSvc.update).toHaveBeenCalledWith('si1', { productId: null }, 'u1', 'o1')
    expect(result.updated).toEqual(['productId'])
  })

  test('delete reports ambiguity without deleting', async () => {
    saleItemSvc.list.mockResolvedValue({ items: [{ id: 'a', name: 'Combo One' }, { id: 'b', name: 'Combo Two' }] })
    const { result } = await byName.delete_sale_item.handler({ search: 'combo' }, ctx)
    expect(saleItemSvc.remove).not.toHaveBeenCalled()
    expect(result).toMatch(/Multiple sale items match/)
  })
})

describe('sale packages', () => {
  test('create resolves each bundle line to a sale item id', async () => {
    saleItemSvc.list
      .mockResolvedValueOnce({ items: [{ id: 'si1', name: 'Widget Sale', code: 'SI-1' }] })
      .mockResolvedValueOnce({ items: [{ id: 'si2', name: 'Gadget Sale', code: 'SI-2' }] })
    pkgSvc.create.mockResolvedValue({ id: 'pk1', name: 'Combo', code: 'PKG-1', packageItems: [{}, {}] })

    const { result, action } = await byName.create_sale_package.handler({
      name: 'Combo', items: [{ saleItem: 'Widget Sale', quantity: 2 }, { saleItem: 'SI-2' }],
    }, ctx)

    expect(pkgSvc.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Combo', autoCode: true, organizationId: 'o1',
      items: [
        { saleItemId: 'si1', quantity: 2, unitPrice: null },
        { saleItemId: 'si2', quantity: 1, unitPrice: null },
      ],
    }))
    expect(result).toMatchObject({ id: 'pk1', itemCount: 2 })
    expect(action.path).toBe('/erp/sale-packages/pk1/edit')
  })

  test('create reports an unknown bundle line item', async () => {
    saleItemSvc.list.mockResolvedValueOnce({ items: [] })
    const { result } = await byName.create_sale_package.handler({ name: 'Combo', items: [{ saleItem: 'ghost' }] }, ctx)
    expect(result).toMatch(/No sale item matches/)
    expect(pkgSvc.create).not.toHaveBeenCalled()
  })

  test('get returns bundled items', async () => {
    pkgSvc.list.mockResolvedValue({ items: [{ id: 'pk1', name: 'Combo', code: 'PKG-1' }] })
    pkgSvc.getById.mockResolvedValue({
      id: 'pk1', name: 'Combo', code: 'PKG-1', status: 'active', description: 'bundle',
      packageItems: [{ saleItem: { name: 'Widget Sale', code: 'SI-1' }, quantity: 2, unitPrice: 9 }],
    })
    const { result } = await byName.get_sale_package.handler({ search: 'Combo' }, ctx)
    expect(result.items).toEqual([{ saleItem: 'Widget Sale', code: 'SI-1', quantity: 2, unitPrice: 9 }])
  })

  test('list slims rows with item count', async () => {
    pkgSvc.list.mockResolvedValue({ total: 1, items: [{ id: 'pk1', name: 'Combo', code: 'PKG-1', status: 'active', packageItems: [{}, {}, {}] }] })
    const { result, action } = await byName.list_sale_packages.handler({}, ctx)
    expect(result.packages[0]).toMatchObject({ name: 'Combo', itemCount: 3 })
    expect(action.path).toBe('/erp/sale-packages')
  })
})
