jest.mock('../../../server/models', () => ({
  Department: {
    findAndCountAll: jest.fn(),
    findOne:         jest.fn(),
    create:          jest.fn(),
  },
}))

const { Op } = require('sequelize')
const { Department } = require('../../../server/models')
const service = require('../services/department.service')

describe('department.list', () => {
  beforeEach(() => {
    Department.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
  })

  test('paginates, scopes by org, excludes soft-deleted, orders by createdAt DESC', async () => {
    Department.findAndCountAll.mockResolvedValueOnce({ count: 4, rows: [{ id: 'd1' }] })
    const out = await service.list({ organizationId: 'o', page: 2, limit: 2 })
    expect(out).toEqual({ departments: [{ id: 'd1' }], total: 4 })
    const args = Department.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(2)
    expect(args.where.organizationId).toBe('o')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.order).toEqual([['createdAt', 'DESC']])
  })

  test('search filters across name and code', async () => {
    await service.list({ organizationId: 'o', search: 'sales' })
    const or = Department.findAndCountAll.mock.calls[0][0].where[Op.or]
    expect(or[0].name[Op.like]).toBe('%sales%')
    expect(or[1].code[Op.like]).toBe('%sales%')
  })

  test('isActive coerces "true"/"false" strings to booleans', async () => {
    await service.list({ organizationId: 'o', isActive: 'true' })
    expect(Department.findAndCountAll.mock.calls[0][0].where.isActive).toBe(true)

    await service.list({ organizationId: 'o', isActive: 'false' })
    expect(Department.findAndCountAll.mock.calls[1][0].where.isActive).toBe(false)

    await service.list({ organizationId: 'o', isActive: true })
    expect(Department.findAndCountAll.mock.calls[2][0].where.isActive).toBe(true)
  })

  test('isActive omitted or empty-string is NOT added to the where clause', async () => {
    await service.list({ organizationId: 'o' })
    expect(Department.findAndCountAll.mock.calls[0][0].where).not.toHaveProperty('isActive')

    await service.list({ organizationId: 'o', isActive: '' })
    expect(Department.findAndCountAll.mock.calls[1][0].where).not.toHaveProperty('isActive')
  })

  test('activeFrom / activeTo create gte/lte clauses', async () => {
    await service.list({ organizationId: 'o', activeFrom: '2025-01-01', activeTo: '2025-12-31' })
    const w = Department.findAndCountAll.mock.calls[0][0].where
    expect(w.activeFrom[Op.gte]).toBe('2025-01-01')
    expect(w.activeTo[Op.lte]).toBe('2025-12-31')
  })
})

describe('department.create', () => {
  test('passes the data through directly', async () => {
    Department.create.mockResolvedValue({ id: 'd1' })
    const out = await service.create({ name: 'Sales', organizationId: 'o' })
    expect(out).toEqual({ id: 'd1' })
    expect(Department.create).toHaveBeenCalledWith({ name: 'Sales', organizationId: 'o' })
  })
})

describe('department.getById', () => {
  test('scopes the lookup by org', async () => {
    Department.findOne.mockResolvedValue({ id: 'd1' })
    const out = await service.getById('d1', 'o')
    expect(out).toEqual({ id: 'd1' })
    expect(Department.findOne).toHaveBeenCalledWith({ where: { id: 'd1', organizationId: 'o' } })
  })
})

describe('department.update', () => {
  test('throws plain Error when missing', async () => {
    Department.findOne.mockResolvedValue(null)
    await expect(service.update('missing', 'o', { name: 'x' }, 'u'))
      .rejects.toThrow('Department not found')
  })

  test('coerces empty active range strings to null and records modifiedBy', async () => {
    const dept = { update: jest.fn().mockResolvedValue({ id: 'd1', name: 'Sales' }) }
    Department.findOne.mockResolvedValue(dept)
    await service.update('d1', 'o', { name: 'Sales', activeFrom: '', activeTo: '' }, 'u')
    const patch = dept.update.mock.calls[0][0]
    expect(patch.name).toBe('Sales')
    expect(patch.activeFrom).toBeNull()
    expect(patch.activeTo).toBeNull()
    expect(patch.modifiedBy).toBe('u')
  })
})

describe('department.remove', () => {
  test('throws plain Error when missing', async () => {
    Department.findOne.mockResolvedValue(null)
    await expect(service.remove('missing', 'o')).rejects.toThrow('Department not found')
  })

  test('destroys when found', async () => {
    const dept = { destroy: jest.fn().mockResolvedValue() }
    Department.findOne.mockResolvedValue(dept)
    await service.remove('d1', 'o')
    expect(dept.destroy).toHaveBeenCalled()
  })
})
