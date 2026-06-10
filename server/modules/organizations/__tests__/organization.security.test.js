// Security tests for modules/organizations.service — the privilege-escalation
// guards and the logo-upload hardening.
//
// `organizations.edit` is a delegable permission, so without these guards a
// non-admin holding it could mint a system admin, assign themselves a role
// carrying permissions they don't have, or change billing plans. The logo
// upload is an untrusted file sink served from the app origin, so it must
// reject script-bearing SVGs and contain path traversal.
//
// resolvePermissions, billing, fs and the models are all mocked so the suite is
// pure logic with no DB, network, or filesystem.

jest.mock('../../../models', () => ({
  User:       { findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn(), findAndCountAll: jest.fn(), findAll: jest.fn() },
  Module:     { findAll: jest.fn() },
  Role:       { findAll: jest.fn(), findOne: jest.fn() },
  Permission: {},
  Employee:       { findOne: jest.fn() },
  HrmsRole:       {},
  HrmsPermission: {},
  Subscription:   {},
  Plan:           {},
}))
jest.mock('../../billing/billing.service', () => ({
  assertSeatAvailable:       jest.fn(),
  ensureDefaultSubscription: jest.fn(),
  subscribe:                 jest.fn(),
  getSubscription:           jest.fn(),
}))
jest.mock('../../../middleware/permission', () => ({ resolvePermissions: jest.fn() }))
jest.mock('fs', () => ({
  existsSync:    jest.fn(() => true),  // logo dir always "exists" → no mkdir
  mkdirSync:     jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync:    jest.fn(),
}))

const fs = require('fs')
const { User, Role } = require('../../../models')
const billing = require('../../billing/billing.service')
const { resolvePermissions } = require('../../../middleware/permission')
const service = require('../organization.service')

const ADMIN = { role: 'admin' }
const STAFF = { role: 'user' }

beforeEach(() => {
  jest.clearAllMocks()
  fs.existsSync.mockReturnValue(true)
})

describe('guard: assertCanSetAdminRole (create)', () => {
  test('a non-admin actor cannot grant the admin role', async () => {
    await expect(service.create({ name: 'X', email: 'x@x.com', password: 'p', role: 'admin' }, STAFF))
      .rejects.toEqual({ status: 403, message: 'Only system administrators can grant the admin role.' })
    // Rejected before any user row is read/created.
    expect(User.findOne).not.toHaveBeenCalled()
    expect(User.create).not.toHaveBeenCalled()
  })

  test('an internal call (no actor) is trusted and skips the guard', async () => {
    User.findOne.mockResolvedValue(null)
    const org = { id: 'o1', organizationId: null, setRoles: jest.fn().mockResolvedValue() }
    User.create.mockResolvedValue(org)
    Role.findOne.mockResolvedValue(null)
    User.findByPk.mockResolvedValue({ id: 'o1' })
    billing.ensureDefaultSubscription.mockResolvedValue()

    await expect(service.create({ name: 'Sys', email: 's@x.com', password: 'p', role: 'admin' }))
      .resolves.toBeDefined()
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin' }))
  })
})

describe('guard: assertCanSetAdminRole (update)', () => {
  test('a non-admin actor cannot escalate a user to admin', async () => {
    User.findByPk.mockResolvedValue({ organizationId: null, update: jest.fn() })
    await expect(service.update('o1', { role: 'admin' }, STAFF))
      .rejects.toEqual({ status: 403, message: 'Only system administrators can grant the admin role.' })
  })

  test('an internal call (no actor) may set the role', async () => {
    const org = { organizationId: null, update: jest.fn().mockResolvedValue() }
    User.findByPk.mockResolvedValueOnce(org).mockResolvedValueOnce({ id: 'o1' })
    await service.update('o1', { role: 'admin' })
    expect(org.update).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin' }))
  })
})

describe('guard: assertCanAssignRoles', () => {
  test('a delegate cannot assign a role granting permissions they lack', async () => {
    Role.findAll.mockResolvedValue([{ name: 'Manager', permissions: [{ slug: 'users.delete' }] }])
    resolvePermissions.mockResolvedValue(new Set(['users.view'])) // actor lacks users.delete

    await expect(service.create({ name: 'X', email: 'x@x.com', password: 'p', roleIds: ['r1'] }, STAFF))
      .rejects.toMatchObject({ status: 403, message: expect.stringContaining('Manager') })
    expect(User.create).not.toHaveBeenCalled()
  })

  test('a delegate can assign a role whose permissions they already hold', async () => {
    Role.findAll.mockResolvedValue([{ name: 'Manager', permissions: [{ slug: 'users.delete' }] }])
    resolvePermissions.mockResolvedValue(new Set(['users.delete']))
    User.findOne.mockResolvedValue(null)
    const org = { id: 'o1', organizationId: null, setRoles: jest.fn().mockResolvedValue() }
    User.create.mockResolvedValue(org)
    User.findByPk.mockResolvedValue({ id: 'o1' })
    billing.ensureDefaultSubscription.mockResolvedValue()

    await service.create({ name: 'X', email: 'x@x.com', password: 'p', roleIds: ['r1'] }, STAFF)
    expect(org.setRoles).toHaveBeenCalled()
  })

  test('a system admin bypasses the per-permission check entirely', async () => {
    Role.findAll.mockResolvedValue([{ name: 'Manager', permissions: [{ slug: 'users.delete' }] }])
    User.findOne.mockResolvedValue(null)
    const org = { id: 'o1', organizationId: null, setRoles: jest.fn().mockResolvedValue() }
    User.create.mockResolvedValue(org)
    User.findByPk.mockResolvedValue({ id: 'o1' })
    billing.ensureDefaultSubscription.mockResolvedValue()

    await service.create({ name: 'X', email: 'x@x.com', password: 'p', roleIds: ['r1'] }, ADMIN)
    expect(resolvePermissions).not.toHaveBeenCalled() // short-circuited on actor.role === 'admin'
  })
})

describe('guard: assertCanSetPlan', () => {
  test('setting a plan without billing.manage is forbidden for a delegate', async () => {
    resolvePermissions.mockResolvedValue(new Set(['organizations.edit'])) // no billing.manage / '*'
    await expect(service.create({ name: 'X', email: 'x@x.com', password: 'p', planId: 'pro' }, STAFF))
      .rejects.toEqual({ status: 403, message: 'You need the billing.manage permission to set a subscription plan.' })
    expect(billing.subscribe).not.toHaveBeenCalled()
  })

  test('a delegate holding billing.manage may set the plan', async () => {
    resolvePermissions.mockResolvedValue(new Set(['billing.manage']))
    User.findOne.mockResolvedValue(null)
    const org = { id: 'o1', organizationId: null, setRoles: jest.fn().mockResolvedValue() }
    User.create.mockResolvedValue(org)
    Role.findOne.mockResolvedValue(null)
    User.findByPk.mockResolvedValue({ id: 'o1' })
    billing.subscribe.mockResolvedValue()

    await service.create({ name: 'X', email: 'x@x.com', password: 'p', planId: 'pro' }, STAFF)
    expect(billing.subscribe).toHaveBeenCalledWith('o1', 'pro')
  })

  test('changing a plan via update also requires billing.manage', async () => {
    User.findByPk.mockResolvedValue({ organizationId: null, update: jest.fn().mockResolvedValue() })
    resolvePermissions.mockResolvedValue(new Set([])) // delegate without billing.manage
    await expect(service.update('o1', { planId: 'pro' }, STAFF))
      .rejects.toEqual({ status: 403, message: 'You need the billing.manage permission to set a subscription plan.' })
  })
})

describe('uploadLogo — file-sink hardening', () => {
  test('rejects a script-bearing SVG (stored-XSS vector)', async () => {
    User.findByPk.mockResolvedValue({ id: 'o1' })
    await expect(service.uploadLogo('o1', { dataBase64: 'PHN2Zz48L3N2Zz4=', contentType: 'image/svg+xml' }))
      .rejects.toEqual({ status: 400, message: 'Unsupported logo type "image/svg+xml"' })
    expect(fs.writeFileSync).not.toHaveBeenCalled()
  })

  test('contains path traversal in the id and never writes outside the logo root', async () => {
    User.findByPk.mockResolvedValue({ id: 'evil' })
    const traversingId = '../'.repeat(20) + 'evil'
    await expect(service.uploadLogo(traversingId, { dataBase64: Buffer.from('x').toString('base64'), contentType: 'image/png' }))
      .rejects.toEqual({ status: 400, message: 'Invalid file path' })
    expect(fs.writeFileSync).not.toHaveBeenCalled()
  })
})
