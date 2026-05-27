// Unit tests for product-category.service.
//
// The category tree allows only one level of nesting. Both create() and
// update() enforce this; update() additionally guards against self-parent
// and child-as-parent cycles. These are the most interesting paths to cover.

jest.mock('../../../../server/models', () => ({
  ProductCategory: {
    findAndCountAll: jest.fn(),
    findAll:         jest.fn(),
    findByPk:        jest.fn(),
    findOne:         jest.fn(),
    create:          jest.fn(),
    count:           jest.fn(),
  },
}))

jest.mock('../../settings/services/sequence.service', () => ({
  getNext: jest.fn(),
}), { virtual: true })

const { Op } = require('sequelize')
const { ProductCategory } = require('../../../../server/models')
const seqSvc = require('../../settings/services/sequence.service')
const service = require('../services/product-category.service')

describe('product-category.service.list', () => {
  beforeEach(() => {
    ProductCategory.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
  })

  test('paginates, scopes by org, excludes soft-deleted, eager-loads parent', async () => {
    ProductCategory.findAndCountAll.mockResolvedValueOnce({ count: 2, rows: [{ id: 'c1' }] })
    const out = await service.list({ page: 2, limit: 5, organizationId: 'org-1' })
    expect(out).toEqual({ total: 2, page: 2, limit: 5, categories: [{ id: 'c1' }] })

    const args = ProductCategory.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(5)
    expect(args.where.organizationId).toBe('org-1')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.distinct).toBe(true)
    expect(args.include[0]).toMatchObject({ as: 'parent', attributes: ['id', 'name'] })
  })

  test('search filters on name only', async () => {
    await service.list({ search: 'food', organizationId: 'org-1' })
    expect(ProductCategory.findAndCountAll.mock.calls[0][0].where.name[Op.like]).toBe('%food%')
  })
})

describe('product-category.service.listAll', () => {
  test('returns minimal active rows scoped to org', async () => {
    ProductCategory.findAll.mockResolvedValue([{ id: 'c1', name: 'Food', parentId: null }])
    await service.listAll('org-1')
    expect(ProductCategory.findAll).toHaveBeenCalledWith({
      where: { status: 'active', organizationId: 'org-1' },
      attributes: ['id', 'name', 'parentId'],
      order: [['name', 'ASC']],
    })
  })
})

describe('product-category.service.getById', () => {
  test('returns the row with parent + children includes', async () => {
    ProductCategory.findByPk.mockResolvedValue({ id: 'c1', name: 'Food', children: [] })
    await expect(service.getById('c1')).resolves.toEqual({ id: 'c1', name: 'Food', children: [] })
    const args = ProductCategory.findByPk.mock.calls[0][1]
    const aliases = args.include.map(i => i.as).sort()
    expect(aliases).toEqual(['children', 'parent'])
  })

  test('throws 404 when missing', async () => {
    ProductCategory.findByPk.mockResolvedValue(null)
    await expect(service.getById('missing')).rejects.toEqual({ status: 404, message: 'Product category not found' })
  })
})

describe('product-category.service.create', () => {
  test('rejects blank names', async () => {
    await expect(service.create({ name: '   ' })).rejects.toEqual({ status: 400, message: 'Name is required' })
    expect(ProductCategory.create).not.toHaveBeenCalled()
  })

  test('uses the CAT sequence when autoCode is true', async () => {
    seqSvc.getNext.mockResolvedValue('CAT-0003')
    ProductCategory.create.mockResolvedValue({ id: 'c1' })
    await service.create({ name: 'Food', autoCode: true, userId: 'u1' })
    expect(seqSvc.getNext).toHaveBeenCalledWith('CAT', 'u1')
    expect(ProductCategory.create.mock.calls[0][0].code).toBe('CAT-0003')
  })

  test('rejects duplicate explicit code within the same organization', async () => {
    ProductCategory.findOne.mockResolvedValue({ id: 'dup' })
    await expect(service.create({ name: 'Food', code: 'F', organizationId: 'org-1' }))
      .rejects.toEqual({ status: 400, message: 'Category code already exists' })
    expect(ProductCategory.findOne).toHaveBeenCalledWith({ where: { code: 'F', organizationId: 'org-1' } })
  })

  test('rejects when the parent does not exist', async () => {
    ProductCategory.findByPk.mockResolvedValue(null)
    await expect(service.create({ name: 'Snacks', parentId: 'missing' }))
      .rejects.toEqual({ status: 400, message: 'Parent category not found' })
  })

  test('rejects when the parent already has a parent (max 1 level deep)', async () => {
    ProductCategory.findByPk.mockResolvedValue({ id: 'parent', parentId: 'grandparent' })
    await expect(service.create({ name: 'Snacks', parentId: 'parent' }))
      .rejects.toEqual({ status: 400, message: 'Cannot nest more than one level deep' })
  })

  test('accepts a top-level parent and trims values', async () => {
    ProductCategory.findByPk.mockResolvedValue({ id: 'parent', parentId: null })
    ProductCategory.create.mockResolvedValue({ id: 'new' })
    await service.create({ name: '  Snacks  ', code: '  S  ', parentId: 'parent', organizationId: 'org-1' })
    const payload = ProductCategory.create.mock.calls[0][0]
    expect(payload.name).toBe('Snacks')
    expect(payload.code).toBe('S')
    expect(payload.parentId).toBe('parent')
    expect(payload.status).toBe('active')
  })
})

describe('product-category.service.update', () => {
  test('throws 404 when missing', async () => {
    ProductCategory.findByPk.mockResolvedValue(null)
    await expect(service.update('missing', { name: 'x' })).rejects.toEqual({ status: 404, message: 'Product category not found' })
  })

  test('rejects code collision with another category from the same creator', async () => {
    const cat = { id: 'c1', createdBy: 'u-creator', update: jest.fn() }
    ProductCategory.findByPk.mockResolvedValue(cat)
    ProductCategory.findOne.mockResolvedValue({ id: 'c2' })
    await expect(service.update('c1', { code: 'DUP' }, 'u2'))
      .rejects.toEqual({ status: 400, message: 'Category code already exists' })
    expect(ProductCategory.findOne).toHaveBeenCalledWith({ where: { code: 'DUP', createdBy: 'u-creator' } })
    expect(cat.update).not.toHaveBeenCalled()
  })

  test('rejects when a category is set as its own parent', async () => {
    const cat = { id: 'c1', createdBy: 'u', update: jest.fn() }
    ProductCategory.findByPk.mockResolvedValueOnce(cat)
    await expect(service.update('c1', { parentId: 'c1' }, 'u2'))
      .rejects.toEqual({ status: 400, message: 'Category cannot be its own parent' })
  })

  test('rejects when the target parent already has a parent', async () => {
    const cat = { id: 'c1', createdBy: 'u', update: jest.fn() }
    ProductCategory.findByPk
      .mockResolvedValueOnce(cat)
      .mockResolvedValueOnce({ id: 'parent', parentId: 'grandparent' })
    await expect(service.update('c1', { parentId: 'parent' }, 'u2'))
      .rejects.toEqual({ status: 400, message: 'Cannot nest more than one level deep' })
  })

  test('rejects when the target parent is one of this category’s own children', async () => {
    const cat = { id: 'c1', createdBy: 'u', update: jest.fn() }
    ProductCategory.findByPk
      .mockResolvedValueOnce(cat)
      .mockResolvedValueOnce({ id: 'child-becomes-parent', parentId: null })
    ProductCategory.findAll.mockResolvedValue([{ id: 'child-becomes-parent' }])
    await expect(service.update('c1', { parentId: 'child-becomes-parent' }, 'u2'))
      .rejects.toEqual({ status: 400, message: 'Cannot set a child category as parent' })
  })

  test('happy path: applies allowed fields, trims, coerces nulls, re-reads via getById', async () => {
    const cat = {
      id: 'c1', createdBy: 'u-creator',
      update: jest.fn().mockResolvedValue(),
    }
    ProductCategory.findByPk
      .mockResolvedValueOnce(cat)                                    // first findByPk for the row
      .mockResolvedValueOnce({ id: 'c1', name: 'Food', children: [] }) // getById re-read at the end

    const out = await service.update('c1', {
      name: '  Food  ',
      code: '  F  ',
      parentId: '',          // empty → null
      activeFrom: '',
      activeTo: '2026-01-01',
    }, 'u2')

    const patch = cat.update.mock.calls[0][0]
    expect(patch.name).toBe('Food')
    expect(patch.code).toBe('F')
    expect(patch.parentId).toBeNull()
    expect(patch.activeFrom).toBeNull()
    expect(patch.activeTo).toBe('2026-01-01')
    expect(patch.modifiedBy).toBe('u2')
    expect(out).toEqual({ id: 'c1', name: 'Food', children: [] })
  })
})

describe('product-category.service.remove', () => {
  test('throws 404 when missing', async () => {
    ProductCategory.findByPk.mockResolvedValue(null)
    await expect(service.remove('missing')).rejects.toEqual({ status: 404, message: 'Product category not found' })
  })

  test('blocks deletion when the category has sub-categories', async () => {
    const cat = { id: 'c1', destroy: jest.fn() }
    ProductCategory.findByPk.mockResolvedValue(cat)
    ProductCategory.count.mockResolvedValue(3)
    await expect(service.remove('c1'))
      .rejects.toEqual({ status: 400, message: 'Cannot delete a category that has sub-categories' })
    expect(ProductCategory.count).toHaveBeenCalledWith({ where: { parentId: 'c1' } })
    expect(cat.destroy).not.toHaveBeenCalled()
  })

  test('destroys when there are no sub-categories', async () => {
    const cat = { id: 'c1', destroy: jest.fn().mockResolvedValue() }
    ProductCategory.findByPk.mockResolvedValue(cat)
    ProductCategory.count.mockResolvedValue(0)
    await service.remove('c1')
    expect(cat.destroy).toHaveBeenCalled()
  })
})
