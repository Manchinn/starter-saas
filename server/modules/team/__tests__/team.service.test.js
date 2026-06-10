// Security/logic tests for the team (staff self-service) module.
//
// Everything is mocked (models, billing, the org-service guard, permission
// resolver) so the suite is pure logic: it pins org-scoping (cross-tenant
// IDOR), the no-admin-creation rule, seat-limit enforcement, the role-grant
// anti-escalation hand-off, self-lockout guards, and session revocation on a
// password reset.

jest.mock('../../../models', () => ({
  User:         { findOne: jest.fn(), findAll: jest.fn(), create: jest.fn() },
  Role:         { findAll: jest.fn() },
  Permission:   {},
  RefreshToken: { update: jest.fn() },
}))
jest.mock('../../billing/billing.service', () => ({ assertSeatAvailable: jest.fn() }))
jest.mock('../../organizations/organization.service', () => ({ assertCanAssignRoles: jest.fn() }))
jest.mock('../../../middleware/permission', () => ({ resolvePermissions: jest.fn() }))

const { User, Role, RefreshToken } = require('../../../models')
const billing = require('../../billing/billing.service')
const orgService = require('../../organizations/organization.service')
const { resolvePermissions } = require('../../../middleware/permission')
const service = require('../team.service')

const ORG = 'org-1'
const OWNER = { id: 'owner-1', role: 'user', organizationId: null }

beforeEach(() => {
  jest.clearAllMocks()
  orgService.assertCanAssignRoles.mockResolvedValue()
  billing.assertSeatAvailable.mockResolvedValue()
})

describe('list / getById — org scoping', () => {
  test('list constrains the query to the caller org', async () => {
    User.findAll.mockResolvedValue([])
    await service.list(ORG, { search: 'ann' })
    const arg = User.findAll.mock.calls[0][0]
    expect(arg.where.organizationId).toBe(ORG)
    // search builds an OR over name/email
    expect(arg.where[Object.getOwnPropertySymbols(arg.where)[0]]).toBeDefined()
  })

  test('getById 404s on a missing/foreign staff id (scoped lookup)', async () => {
    User.findOne.mockResolvedValue(null)
    await expect(service.getById(ORG, 'nope')).rejects.toMatchObject({ status: 404 })
    expect(User.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'nope', organizationId: ORG },
    }))
  })
})

describe('create', () => {
  test('creates a plain user scoped to the org, after seat + role-grant guards', async () => {
    User.findOne
      .mockResolvedValueOnce(null)                                  // email free
      .mockResolvedValueOnce({ id: 's1', name: 'Ann' })             // getById reload
    const newStaff = { id: 's1', setRoles: jest.fn().mockResolvedValue() }
    User.create.mockResolvedValue(newStaff)
    Role.findAll.mockResolvedValue([{ id: 'r1' }])

    await service.create(ORG, { name: 'Ann', email: 'ann@x.com', password: 'secret12', roleIds: ['r1'] }, OWNER)

    expect(orgService.assertCanAssignRoles).toHaveBeenCalledWith(OWNER, ['r1'])
    expect(billing.assertSeatAvailable).toHaveBeenCalledWith(ORG)
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'ann@x.com', role: 'user', organizationId: ORG, isActive: true,
    }))
    expect(newStaff.setRoles).toHaveBeenCalled()
  })

  test('never creates an admin even if role:admin is passed in the body', async () => {
    User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 's1' })
    User.create.mockResolvedValue({ id: 's1', setRoles: jest.fn() })

    await service.create(ORG, { name: 'X', email: 'x@x.com', password: 'secret12', role: 'admin' }, OWNER)

    expect(User.create.mock.calls[0][0].role).toBe('user')
  })

  test('rejects a duplicate email before touching seats or creating', async () => {
    User.findOne.mockResolvedValueOnce({ id: 'existing' })
    await expect(service.create(ORG, { name: 'X', email: 'dup@x.com', password: 'secret12' }, OWNER))
      .rejects.toMatchObject({ status: 409 })
    expect(billing.assertSeatAvailable).not.toHaveBeenCalled()
    expect(User.create).not.toHaveBeenCalled()
  })

  test('propagates the anti-escalation guard rejection (no create)', async () => {
    orgService.assertCanAssignRoles.mockRejectedValue({ status: 403, message: 'nope' })
    await expect(service.create(ORG, { name: 'X', email: 'x@x.com', password: 'secret12', roleIds: ['r1'] }, OWNER))
      .rejects.toMatchObject({ status: 403 })
    expect(User.create).not.toHaveBeenCalled()
  })

  test('blocks when no seat is available (plan limit)', async () => {
    User.findOne.mockResolvedValueOnce(null)
    billing.assertSeatAvailable.mockRejectedValue({ status: 403, message: 'Seat limit reached' })
    await expect(service.create(ORG, { name: 'X', email: 'x@x.com', password: 'secret12' }, OWNER))
      .rejects.toMatchObject({ status: 403, message: 'Seat limit reached' })
    expect(User.create).not.toHaveBeenCalled()
  })
})

describe('update', () => {
  test('blocks a manager from deactivating their own account', async () => {
    User.findOne.mockResolvedValueOnce({ id: 'owner-1', email: 'o@x.com', update: jest.fn() })
    await expect(service.update(ORG, 'owner-1', { isActive: false }, OWNER))
      .rejects.toMatchObject({ status: 400 })
  })

  test('rejects an email collision with another user', async () => {
    User.findOne
      .mockResolvedValueOnce({ id: 's1', email: 'old@x.com', update: jest.fn() }) // findScoped
      .mockResolvedValueOnce({ id: 'other' })                                     // email taken
    await expect(service.update(ORG, 's1', { email: 'taken@x.com' }, OWNER))
      .rejects.toMatchObject({ status: 409 })
  })

  test('applies allowed fields and reloads', async () => {
    const staff = { id: 's1', email: 'old@x.com', update: jest.fn().mockResolvedValue() }
    User.findOne
      .mockResolvedValueOnce(staff)                       // findScoped
      .mockResolvedValueOnce({ id: 's1', name: 'New' })   // getById reload
    await service.update(ORG, 's1', { name: 'New', isActive: false }, OWNER)
    expect(staff.update).toHaveBeenCalledWith(expect.objectContaining({ name: 'New', isActive: false }))
  })
})

describe('setPassword', () => {
  test('updates the password and revokes the staff member’s sessions', async () => {
    const staff = { id: 's1', update: jest.fn().mockResolvedValue() }
    User.findOne.mockResolvedValue(staff)
    await service.setPassword(ORG, 's1', 'brandnew1')
    expect(staff.update).toHaveBeenCalledWith({ password: 'brandnew1' })
    expect(RefreshToken.update).toHaveBeenCalledWith(
      { isRevoked: true },
      { where: { userId: 's1', isRevoked: false } },
    )
  })
})

describe('assignRoles', () => {
  test('runs the anti-escalation guard and sets the roles (scoped)', async () => {
    const staff = { id: 's1', setRoles: jest.fn().mockResolvedValue() }
    User.findOne
      .mockResolvedValueOnce(staff)                     // findScoped
      .mockResolvedValueOnce(staff)                     // re-fetch to setRoles
      .mockResolvedValueOnce({ id: 's1' })              // getById reload
    Role.findAll.mockResolvedValue([{ id: 'r1' }])
    await service.assignRoles(ORG, 's1', ['r1'], OWNER)
    expect(orgService.assertCanAssignRoles).toHaveBeenCalledWith(OWNER, ['r1'])
    expect(staff.setRoles).toHaveBeenCalled()
  })
})

describe('remove', () => {
  test('blocks a manager from deleting their own account', async () => {
    await expect(service.remove(ORG, 'owner-1', OWNER)).rejects.toMatchObject({ status: 400 })
    expect(User.findOne).not.toHaveBeenCalled()
  })

  test('404s on a foreign id and destroys nothing', async () => {
    User.findOne.mockResolvedValue(null)
    await expect(service.remove(ORG, 'foreign', OWNER)).rejects.toMatchObject({ status: 404 })
  })

  test('destroys an in-org staff member', async () => {
    const staff = { id: 's2', destroy: jest.fn().mockResolvedValue() }
    User.findOne.mockResolvedValue(staff)
    await service.remove(ORG, 's2', OWNER)
    expect(staff.destroy).toHaveBeenCalled()
  })
})

describe('assignableRoles', () => {
  test('an admin may assign every role', async () => {
    Role.findAll.mockResolvedValue([
      { id: 'r1', slug: 'a', name: 'A', color: '#000', permissions: [{ slug: 'x' }] },
    ])
    const roles = await service.assignableRoles({ role: 'admin' })
    expect(roles).toHaveLength(1)
    expect(resolvePermissions).not.toHaveBeenCalled()
  })

  test('a non-admin may assign only roles whose permissions they already hold', async () => {
    Role.findAll.mockResolvedValue([
      { id: 'r1', slug: 'viewer', name: 'Viewer', color: '#0', permissions: [{ slug: 'erp.customers.list' }] },
      { id: 'r2', slug: 'power',  name: 'Power',  color: '#1', permissions: [{ slug: 'erp.customers.delete' }] },
    ])
    resolvePermissions.mockResolvedValue(new Set(['erp.customers.list']))
    const roles = await service.assignableRoles({ role: 'user', id: 'u1' })
    expect(roles.map((r) => r.slug)).toEqual(['viewer'])
  })
})
