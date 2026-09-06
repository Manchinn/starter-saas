// Install-path seeding test (issue #16).
//
// seedDefaults() used to keep a private copy of the permission catalog and
// default roles, which drifted from the canonical seeds (a fresh install
// granted the viewer role users.list/roles.list/permissions.list). It now runs
// the canonical permissions/roles seed modules themselves — this test proves
// the install path produces exactly the same grants as a DB_BOOTSTRAP seed run,
// using the real seed code with mocked models.

jest.mock('jsonwebtoken', () => ({ sign: jest.fn(), verify: jest.fn(), decode: jest.fn() }))
jest.mock('../../../config/config', () => ({
  jwt:  { secret: 's', expiresIn: '15m', refreshSecret: 'rs', refreshExpiresIn: '7d' },
  auth: { requireEmailVerification: false, emailVerificationExpiresHours: 24, passwordResetExpiresMinutes: 60 },
  clientUrl: 'http://app.test',
}))
jest.mock('../../../models', () => ({
  User:               { scope: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn(), count: jest.fn(), update: jest.fn() },
  Role:               { findOne: jest.fn(), findAll: jest.fn(), findOrCreate: jest.fn() },
  Permission:         { findAll: jest.fn(), findOrCreate: jest.fn() },
  Module:             { findAll: jest.fn() },
  RefreshToken:       { create: jest.fn(), findOne: jest.fn(), update: jest.fn(), destroy: jest.fn() },
  MasterDataCategory: { findOrCreate: jest.fn() },
  MasterDataValue:    { findOrCreate: jest.fn() },
  Employee:           { findOne: jest.fn() },
  HrmsRole:           {},
  HrmsPermission:     {},
  Subscription:       { findOne: jest.fn() },
  Plan:               {},
  UsageCounter:       {},
  SubscriptionInvoice: {},
}))
jest.mock('../../../core/mailer', () => ({ sendEmailVerification: jest.fn(), sendPasswordReset: jest.fn() }))
jest.mock('../../../core/logger', () => ({ forLabel: () => ({ warn: jest.fn() }) }))
// Shared module permission slugs are whatever the loaded shared modules declare;
// a fixed pair keeps this test hermetic (the slugs themselves are arbitrary).
jest.mock('../../../core/module.loader', () => ({
  sharedModulePermissionSlugs: () => ['erp.customers.list', 'hrms.employees.list'],
  describePermissionSlug: (slug) => ({ slug, name: slug, group: slug.split('.')[0], description: 'test' }),
}))

const jwt = require('jsonwebtoken')
const { User, Role, Permission, Module, MasterDataCategory, MasterDataValue, RefreshToken } = require('../../../models')
const mailer = require('../../../core/mailer')
const service = require('../auth.service')

// Roles/permissions created by the seeds, keyed by slug — so assertions can
// inspect the exact grants each role received.
const rolesBySlug = {}

beforeEach(() => {
  jest.clearAllMocks()
  rolesBySlug.superadmin = undefined
  for (const key of Object.keys(rolesBySlug)) delete rolesBySlug[key]

  jwt.sign.mockReturnValue('signed-token')
  jwt.decode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 })
  jwt.verify.mockReturnValue({ id: 'admin-1' })
  mailer.sendEmailVerification.mockResolvedValue()
  RefreshToken.create.mockResolvedValue()

  // Nothing installed yet.
  User.count.mockResolvedValue(0)
  User.findOne.mockResolvedValue(null)

  // Seed plumbing: findOrCreate fabricates a minimal model row per slug.
  Permission.findOrCreate.mockImplementation(async ({ where }) => [{ id: `p-${where.slug}`, slug: where.slug }, true])
  Role.findOrCreate.mockImplementation(async ({ where, defaults }) => {
    const role = { id: `r-${where.slug}`, slug: where.slug, ...defaults, setPermissions: jest.fn().mockResolvedValue(), setModules: jest.fn().mockResolvedValue() }
    rolesBySlug[where.slug] = role
    return [role, true]
  })
  Module.findAll.mockResolvedValue([{ id: 'm1', isCore: false }])

  // Master data seed.
  MasterDataCategory.findOrCreate.mockImplementation(async ({ where }) => [{ id: `cat-${where.slug}`, ...where }, true])
  MasterDataValue.findOrCreate.mockResolvedValue([{ id: 'v' }, true])

  // install() creates the admin and assigns super-admin.
  User.create.mockImplementation(async (data) => ({
    id: 'admin-1', ...data, roles: [], organizationId: null, isActive: true,
    update: jest.fn().mockResolvedValue(),
    setRoles: jest.fn().mockResolvedValue(),
    toJSON() { return { id: this.id, email: this.email, name: this.name, role: this.role } },
  }))
  Role.findOne.mockImplementation(async ({ where }) => rolesBySlug[where.slug] || null)
  User.findByPk.mockResolvedValue({ id: 'admin-1', roles: [], organizationId: null, locked: false, toJSON() { return { id: 'admin-1', role: 'admin' } } })
})

const grantedSlugs = (role) => role.setPermissions.mock.calls[0][0].map((p) => p.slug)

describe('install seeding — canonical grant sets (issue #16)', () => {
  test('install() provisions roles/permissions identical to the canonical seeds', async () => {
    await service.install({ name: 'Admin', email: 'a@x.com', password: 'password123' })

    // Roles the canonical seed defines must all exist.
    expect(Object.keys(rolesBySlug).sort()).toEqual(['customer', 'manager', 'super-admin', 'viewer'])

    // Viewer: read-only minimum — the post-#11 grant set. Nothing more.
    expect(grantedSlugs(rolesBySlug.viewer).sort()).toEqual(['dashboard.view', 'modules.list'])
    expect(grantedSlugs(rolesBySlug.viewer)).not.toContain('organizations.list')
    expect(grantedSlugs(rolesBySlug.viewer)).not.toContain('users.list')

    // Manager keeps the org-management plane.
    const manager = grantedSlugs(rolesBySlug.manager)
    expect(manager).toContain('organizations.list')
    expect(manager).toContain('organizations.edit')

    // Super-admin receives every seeded permission (the '*' sentinel).
    const superAdmin = grantedSlugs(rolesBySlug['super-admin'])
    expect(superAdmin).toEqual(expect.arrayContaining(['dashboard.view', 'organizations.list', 'erp.customers.list', 'hrms.employees.list']))

    // Customer: dashboard + shared module permissions only.
    const customer = grantedSlugs(rolesBySlug.customer)
    expect(customer).toEqual(expect.arrayContaining(['dashboard.view', 'erp.customers.list', 'hrms.employees.list']))
    expect(customer).not.toContain('organizations.list')
    expect(rolesBySlug.customer.setModules).toHaveBeenCalled()
  })

  test('the platform catalog still contains the organizations permissions', async () => {
    await service.install({ name: 'Admin', email: 'a@x.com', password: 'password123' })
    const created = Permission.findOrCreate.mock.calls.map(([{ where }]) => where.slug)
    expect(created).toEqual(expect.arrayContaining(['organizations.list', 'organizations.edit', 'organizations.delete', 'dashboard.view']))
  })

  test('install() creates the admin account and assigns super-admin', async () => {
    let createdUser = null
    User.create.mockImplementation(async (data) => {
      createdUser = {
        id: 'admin-1', ...data, roles: [], organizationId: null, isActive: true,
        update: jest.fn().mockResolvedValue(),
        setRoles: jest.fn().mockResolvedValue(),
        toJSON() { return { id: this.id, email: this.email, name: this.name, role: this.role } },
      }
      return createdUser
    })
    await service.install({ name: 'Admin', email: 'a@x.com', password: 'password123' })
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'a@x.com', role: 'admin' }))
    expect(createdUser.setRoles).toHaveBeenCalledWith([rolesBySlug['super-admin']])
  })
})
