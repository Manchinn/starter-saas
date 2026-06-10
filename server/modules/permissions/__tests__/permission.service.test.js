// Unit tests for modules/permissions.service — plain CRUD over the Permission
// model with a roleCount projection on list and a slug-uniqueness guard.

jest.mock('../../../models', () => ({
  Permission: { findAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  Role:       {},
}))

const { Permission } = require('../../../models')
const service = require('../permission.service')

describe('permission.list', () => {
  test('orders by group then name and projects roleCount, dropping the roles array', async () => {
    Permission.findAll.mockResolvedValue([
      { toJSON: () => ({ id: 'p1', slug: 'a', roles: [{ id: 'r1' }, { id: 'r2' }] }) },
      { toJSON: () => ({ id: 'p2', slug: 'b', roles: [] }) },
    ])
    const out = await service.list()
    expect(out).toEqual([
      { id: 'p1', slug: 'a', roleCount: 2 },
      { id: 'p2', slug: 'b', roleCount: 0 },
    ])
    expect(Permission.findAll.mock.calls[0][0].order).toEqual([['group', 'DESC'], ['name', 'DESC']])
  })
})

describe('permission.getById', () => {
  test('throws 404 when missing', async () => {
    Permission.findByPk.mockResolvedValue(null)
    await expect(service.getById('x')).rejects.toEqual({ status: 404, message: 'Permission not found' })
  })
})

describe('permission.create', () => {
  test('rejects a duplicate slug', async () => {
    Permission.findOne.mockResolvedValue({ id: 'p1' })
    await expect(service.create({ slug: 'dup' })).rejects.toEqual({ status: 409, message: 'Permission slug already exists' })
  })

  test('defaults the group to "general" when omitted', async () => {
    Permission.findOne.mockResolvedValue(null)
    Permission.create.mockResolvedValue({ id: 'p1' })
    await service.create({ name: 'View', slug: 'view' })
    expect(Permission.create).toHaveBeenCalledWith(expect.objectContaining({ slug: 'view', group: 'general' }))
  })
})

describe('permission.update', () => {
  test('throws 404 when missing', async () => {
    Permission.findByPk.mockResolvedValue(null)
    await expect(service.update('x', {})).rejects.toEqual({ status: 404, message: 'Permission not found' })
  })

  test('only persists the allowed fields (name/description/group)', async () => {
    const perm = { update: jest.fn().mockResolvedValue() }
    Permission.findByPk.mockResolvedValue(perm)
    await service.update('p1', { name: 'New', group: 'g', slug: 'hack', id: 'evil' })
    expect(perm.update).toHaveBeenCalledWith({ name: 'New', group: 'g' })
  })
})

describe('permission.remove', () => {
  test('throws 404 when missing', async () => {
    Permission.findByPk.mockResolvedValue(null)
    await expect(service.remove('x')).rejects.toEqual({ status: 404, message: 'Permission not found' })
  })

  test('destroys an existing permission', async () => {
    const perm = { destroy: jest.fn().mockResolvedValue() }
    Permission.findByPk.mockResolvedValue(perm)
    await service.remove('p1')
    expect(perm.destroy).toHaveBeenCalled()
  })
})
