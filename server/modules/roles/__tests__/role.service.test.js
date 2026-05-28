// Unit tests for modules/roles.service — CRUD plus the permission/module
// assignment helpers. list projects userCount/permissionCount/moduleCount and
// drops the heavy users array; remove guards system roles.

jest.mock('../../../models', () => ({
  Role:       { findAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  Permission: { findAll: jest.fn() },
  Module:     { findAll: jest.fn() },
  User:       {},
}))

const { Role, Permission, Module } = require('../../../models')
const service = require('../role.service')

describe('role.list', () => {
  test('projects the three counts and removes the users array', async () => {
    Role.findAll.mockResolvedValue([
      { toJSON: () => ({ id: 'r1', name: 'A', users: [{ id: 'u1' }, { id: 'u2' }], permissions: [{ id: 'p1' }], modules: [] }) },
    ])
    const [row] = await service.list()
    expect(row).toEqual({ id: 'r1', name: 'A', permissions: [{ id: 'p1' }], modules: [], userCount: 2, permissionCount: 1, moduleCount: 0 })
    expect(row.users).toBeUndefined()
  })
})

describe('role.getById', () => {
  test('throws 404 when missing', async () => {
    Role.findByPk.mockResolvedValue(null)
    await expect(service.getById('x')).rejects.toEqual({ status: 404, message: 'Role not found' })
  })
})

describe('role.create', () => {
  test('rejects a duplicate slug', async () => {
    Role.findOne.mockResolvedValue({ id: 'r1' })
    await expect(service.create({ slug: 'dup' })).rejects.toEqual({ status: 409, message: 'Role slug already exists' })
  })

  test('creates with the whitelisted fields only', async () => {
    Role.findOne.mockResolvedValue(null)
    Role.create.mockResolvedValue({ id: 'r1' })
    await service.create({ name: 'Mgr', slug: 'mgr', description: 'd', color: '#fff', isSystem: true })
    expect(Role.create).toHaveBeenCalledWith({ name: 'Mgr', slug: 'mgr', description: 'd', color: '#fff' })
  })
})

describe('role.update', () => {
  test('throws 404 when missing', async () => {
    Role.findByPk.mockResolvedValue(null)
    await expect(service.update('x', {})).rejects.toEqual({ status: 404, message: 'Role not found' })
  })

  test('persists only name/description/color', async () => {
    const role = { update: jest.fn().mockResolvedValue() }
    Role.findByPk.mockResolvedValue(role)
    await service.update('r1', { name: 'X', color: '#000', slug: 'hack', isSystem: true })
    expect(role.update).toHaveBeenCalledWith({ name: 'X', color: '#000' })
  })
})

describe('role.remove', () => {
  test('throws 404 when missing', async () => {
    Role.findByPk.mockResolvedValue(null)
    await expect(service.remove('x')).rejects.toEqual({ status: 404, message: 'Role not found' })
  })

  test('refuses to delete a system role', async () => {
    Role.findByPk.mockResolvedValue({ isSystem: true })
    await expect(service.remove('r1')).rejects.toEqual({ status: 400, message: 'System roles cannot be deleted' })
  })

  test('destroys a non-system role', async () => {
    const role = { isSystem: false, destroy: jest.fn().mockResolvedValue() }
    Role.findByPk.mockResolvedValue(role)
    await service.remove('r1')
    expect(role.destroy).toHaveBeenCalled()
  })
})

describe('role.assignPermissions', () => {
  test('throws 404 when the role is missing', async () => {
    Role.findByPk.mockResolvedValue(null)
    await expect(service.assignPermissions('x', ['p1'])).rejects.toEqual({ status: 404, message: 'Role not found' })
  })

  test('sets the resolved permissions and returns the reloaded role', async () => {
    const role = { id: 'r1', setPermissions: jest.fn().mockResolvedValue() }
    Role.findByPk.mockResolvedValue(role) // both the guard lookup and the getById reload
    const perms = [{ id: 'p1' }, { id: 'p2' }]
    Permission.findAll.mockResolvedValue(perms)
    await service.assignPermissions('r1', ['p1', 'p2'])
    expect(Permission.findAll).toHaveBeenCalledWith({ where: { id: ['p1', 'p2'] } })
    expect(role.setPermissions).toHaveBeenCalledWith(perms)
  })
})

describe('role.assignModules', () => {
  test('throws 404 when the role is missing', async () => {
    Role.findByPk.mockResolvedValue(null)
    await expect(service.assignModules('x', ['m1'])).rejects.toEqual({ status: 404, message: 'Role not found' })
  })

  test('sets the resolved modules', async () => {
    const role = { id: 'r1', setModules: jest.fn().mockResolvedValue() }
    Role.findByPk.mockResolvedValue(role)
    const mods = [{ id: 'm1' }]
    Module.findAll.mockResolvedValue(mods)
    await service.assignModules('r1', ['m1'])
    expect(role.setModules).toHaveBeenCalledWith(mods)
  })
})
