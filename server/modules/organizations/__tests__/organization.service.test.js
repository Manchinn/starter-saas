// Unit tests for modules/organizations.service.
//
// Organizations are top-level User rows (organizationId=null) with staff as
// children. We cover the create/update guards and field-whitelisting, the
// list/staff query shaping, the logo-upload validation guards (without
// touching the filesystem), and the permission/module derivation helpers.

jest.mock('../../../models', () => ({
  User:       { findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn(), findAndCountAll: jest.fn(), findAll: jest.fn() },
  Module:     { findAll: jest.fn() },
  Role:       { findAll: jest.fn(), findOne: jest.fn() },
  Permission: {},
}))

jest.mock('../../billing/billing.service', () => ({
  ensureDefaultSubscription: jest.fn(),
  assertSeatAvailable: jest.fn(),
  withSeatLock: jest.fn((organizationId, task) => task()),
}))

const { Op } = require('sequelize')
const { User, Module, Role } = require('../../../models')
const billing = require('../../billing/billing.service')
const service = require('../organization.service')

beforeEach(() => {
  billing.withSeatLock.mockImplementation((organizationId, task) => task())
})

describe('organization.create', () => {
  test('rejects a duplicate email', async () => {
    User.findOne.mockResolvedValue({ id: 'u1' })
    await expect(service.create({ email: 'dup@x.com' })).rejects.toEqual({ status: 409, message: 'Email already registered' })
  })

  test('assigns the default viewer role when no roleIds are given', async () => {
    User.findOne.mockResolvedValue(null)
    const org = { id: 'o1', setRoles: jest.fn().mockResolvedValue() }
    User.create.mockResolvedValue(org)
    Role.findOne.mockResolvedValue({ id: 'viewer' }) // viewer lookup
    User.findByPk.mockResolvedValue({ id: 'o1' })    // getById reload
    await service.create({ name: 'Acme', email: 'a@x.com', password: 'p' })
    expect(Role.findOne).toHaveBeenCalledWith({ where: { slug: 'viewer' } })
    expect(org.setRoles).toHaveBeenCalledWith([{ id: 'viewer' }])
  })

  test('assigns the supplied roleIds when provided', async () => {
    User.findOne.mockResolvedValue(null)
    const org = { id: 'o1', setRoles: jest.fn().mockResolvedValue() }
    User.create.mockResolvedValue(org)
    Role.findAll.mockResolvedValue([{ id: 'r1' }, { id: 'r2' }])
    User.findByPk.mockResolvedValue({ id: 'o1' })
    await service.create({ name: 'Acme', email: 'a@x.com', password: 'p', roleIds: ['r1', 'r2'] })
    expect(org.setRoles).toHaveBeenCalledWith([{ id: 'r1' }, { id: 'r2' }])
  })

  test('creates a default subscription for a top-level organization', async () => {
    User.findOne.mockResolvedValue(null)
    const org = { id: 'o1', setRoles: jest.fn().mockResolvedValue() }
    User.create.mockResolvedValue(org)
    Role.findOne.mockResolvedValue({ id: 'viewer' })
    User.findByPk.mockResolvedValue({ id: 'o1' })

    await service.create({ name: 'Acme', email: 'a@x.com', password: 'p' })

    expect(billing.ensureDefaultSubscription).toHaveBeenCalledWith('o1')
  })

  test('checks the owning organization has a free seat before creating staff', async () => {
    User.findOne.mockResolvedValue(null)
    const staff = { id: 'u1', setRoles: jest.fn().mockResolvedValue() }
    User.create.mockResolvedValue(staff)
    Role.findOne.mockResolvedValue({ id: 'viewer' })
    User.findByPk.mockResolvedValue({ id: 'u1' })

    await service.create({ name: 'Jane', email: 'j@x.com', password: 'p', organizationId: 'o1' })

    expect(billing.assertSeatAvailable).toHaveBeenCalledWith('o1')
  })
})

describe('organization.list', () => {
  test('scopes to top-level orgs and paginates', async () => {
    User.findAndCountAll.mockResolvedValue({ count: 2, rows: [{ id: 'o1' }] })
    const out = await service.list({ page: 2, limit: 5 })
    expect(out).toEqual({ total: 2, page: 2, limit: 5, organizations: [{ id: 'o1' }] })
    const args = User.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(5)
    expect(args.where.organizationId).toBeNull()
    expect(args.where[Op.or]).toBeUndefined()
  })

  test('adds a name/email Op.or when searching', async () => {
    User.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
    await service.list({ search: 'acme' })
    const or = User.findAndCountAll.mock.calls[0][0].where[Op.or]
    expect(or[0].name[Op.like]).toBe('%acme%')
    expect(or[1].email[Op.like]).toBe('%acme%')
  })
})

describe('organization.getById', () => {
  test('throws 404 when missing', async () => {
    User.findByPk.mockResolvedValue(null)
    await expect(service.getById('x')).rejects.toEqual({ status: 404, message: 'Organization not found' })
  })
})

describe('organization.update', () => {
  test('throws 404 when missing', async () => {
    User.findByPk.mockResolvedValue(null)
    await expect(service.update('x', {})).rejects.toEqual({ status: 404, message: 'Organization not found' })
  })

  test('whitelists fields and coerces an empty parentId to null', async () => {
    const org = { update: jest.fn().mockResolvedValue() }
    User.findByPk.mockResolvedValueOnce(org).mockResolvedValueOnce({ id: 'o1' })
    await service.update('o1', { name: 'New', parentId: '', role: 'user', password: 'hack', email: 'nope@x.com' })
    const patch = org.update.mock.calls[0][0]
    expect(patch).toEqual({ name: 'New', parentId: null, role: 'user' })
    expect(patch.password).toBeUndefined()
    expect(patch.email).toBeUndefined()
  })
})

describe('organization.uploadLogo — validation guards', () => {
  test('throws 404 when missing', async () => {
    User.findByPk.mockResolvedValue(null)
    await expect(service.uploadLogo('x', { dataBase64: 'abc', contentType: 'image/png' }))
      .rejects.toEqual({ status: 404, message: 'Organization not found' })
  })

  test('requires logo data', async () => {
    User.findByPk.mockResolvedValue({ id: 'o1' })
    await expect(service.uploadLogo('o1', { contentType: 'image/png' }))
      .rejects.toEqual({ status: 400, message: 'Logo data is required' })
  })

  test('rejects an unsupported content type', async () => {
    User.findByPk.mockResolvedValue({ id: 'o1' })
    await expect(service.uploadLogo('o1', { dataBase64: 'abc', contentType: 'application/pdf' }))
      .rejects.toEqual({ status: 400, message: 'Unsupported logo type "application/pdf"' })
  })

  test('rejects SVG uploads to prevent stored script execution', async () => {
    User.findByPk.mockResolvedValue({ id: 'o1' })
    await expect(service.uploadLogo('o1', { dataBase64: 'PHN2Zz4=', contentType: 'image/svg+xml' }))
      .rejects.toEqual({ status: 400, message: 'Unsupported logo type "image/svg+xml"' })
  })
})

describe('organization.removeLogo', () => {
  test('throws 404 when missing', async () => {
    User.findByPk.mockResolvedValue(null)
    await expect(service.removeLogo('x')).rejects.toEqual({ status: 404, message: 'Organization not found' })
  })

  test('clears logoPath when there is no file to unlink', async () => {
    const org = { logoPath: null, update: jest.fn().mockResolvedValue() }
    User.findByPk.mockResolvedValueOnce(org).mockResolvedValueOnce({ id: 'o1' })
    await service.removeLogo('o1')
    expect(org.update).toHaveBeenCalledWith({ logoPath: null })
  })
})

describe('organization.remove', () => {
  test('throws 404 when missing', async () => {
    User.findByPk.mockResolvedValue(null)
    await expect(service.remove('x')).rejects.toEqual({ status: 404, message: 'Organization not found' })
  })

  test('destroys an existing organization', async () => {
    const org = { destroy: jest.fn().mockResolvedValue() }
    User.findByPk.mockResolvedValue(org)
    await service.remove('o1')
    expect(org.destroy).toHaveBeenCalled()
  })
})

describe('organization.assignModules / assignRoles', () => {
  test('assignModules throws 404 when missing', async () => {
    User.findByPk.mockResolvedValue(null)
    await expect(service.assignModules('x', ['m1'])).rejects.toEqual({ status: 404, message: 'Organization not found' })
  })

  test('assignRoles sets the resolved roles', async () => {
    const org = { id: 'o1', setRoles: jest.fn().mockResolvedValue() }
    User.findByPk.mockResolvedValue(org)
    Role.findAll.mockResolvedValue([{ id: 'r1' }])
    await service.assignRoles('o1', ['r1'])
    expect(org.setRoles).toHaveBeenCalledWith([{ id: 'r1' }])
  })
})

describe('organization.getUserPermissions', () => {
  test('throws 404 when missing', async () => {
    User.findByPk.mockResolvedValue(null)
    await expect(service.getUserPermissions('x')).rejects.toEqual({ status: 404, message: 'Organization not found' })
  })

  test('system admin gets the wildcard', async () => {
    User.findByPk.mockResolvedValue({ role: 'admin', roles: [] })
    expect(await service.getUserPermissions('o1')).toEqual({ isAdmin: true, permissions: ['*'] })
  })

  test('non-admin gets a de-duplicated slug list across roles', async () => {
    User.findByPk.mockResolvedValue({
      role: 'user',
      roles: [
        { permissions: [{ slug: 'a' }, { slug: 'b' }] },
        { permissions: [{ slug: 'b' }] },
      ],
    })
    const out = await service.getUserPermissions('o1')
    expect(out.isAdmin).toBe(false)
    expect(out.permissions.sort()).toEqual(['a', 'b'])
  })
})

describe('organization.getMyModules', () => {
  test('merges direct + role modules, de-duplicating by id', async () => {
    User.findByPk.mockResolvedValue({
      modules: [{ id: 'm1', slug: 'sales' }],
      roles: [{ modules: [{ id: 'm1', slug: 'sales' }, { id: 'm2', slug: 'stock' }] }],
    })
    const out = await service.getMyModules('o1')
    expect(out.map((m) => m.id)).toEqual(['m1', 'm2'])
  })
})

describe('organization.getStaff', () => {
  test('scopes to the org and adds a search Op.or', async () => {
    User.findAll.mockResolvedValue([])
    await service.getStaff('o1', 'jane')
    const where = User.findAll.mock.calls[0][0].where
    expect(where.organizationId).toBe('o1')
    expect(where[Op.or][0].name[Op.like]).toBe('%jane%')
  })
})

describe('organization.listAllStaff', () => {
  test('filters by a specific org when provided', async () => {
    User.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
    await service.listAllStaff({ organizationId: 'o1' })
    expect(User.findAndCountAll.mock.calls[0][0].where.organizationId).toBe('o1')
  })

  test('falls back to all staff (organizationId != null) when no org given', async () => {
    User.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
    await service.listAllStaff({})
    expect(User.findAndCountAll.mock.calls[0][0].where.organizationId[Op.ne]).toBeNull()
  })
})

describe('organization.listAll', () => {
  test('returns only top-level orgs', async () => {
    User.findAll.mockResolvedValue([])
    await service.listAll()
    expect(User.findAll.mock.calls[0][0].where).toEqual({ organizationId: null })
  })
})
