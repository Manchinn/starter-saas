// Unit tests for middleware/permission.
//
// resolvePermissions collapses a user's roles → a Set of permission slugs,
// with system admins short-circuiting to a '*' wildcard (no DB hit).
// requirePermission passes when the user has the wildcard or ANY listed slug.

jest.mock('../../models', () => ({ Role: {}, Permission: {} }))
// The middleware folds HRMS-role grants into the effective permission set.
// Mock the resolver so we can drive that merge deterministically; defaults to
// none so the existing platform-role tests are unaffected.
jest.mock('../../../shared/hrms/services/access.service', () => ({ employeePermissionSlugs: jest.fn() }))

const { employeePermissionSlugs } = require('../../../shared/hrms/services/access.service')
const { requirePermission, resolvePermissions } = require('../permission')

beforeEach(() => employeePermissionSlugs.mockResolvedValue([]))

const makeRes = () => {
  const r = {}
  r.status = jest.fn(() => r)
  r.json   = jest.fn(() => r)
  return r
}

describe('permission.resolvePermissions', () => {
  test('system admin short-circuits to a wildcard without querying roles', async () => {
    const getRoles = jest.fn()
    const perms = await resolvePermissions({ role: 'admin', getRoles })
    expect(perms.has('*')).toBe(true)
    expect(getRoles).not.toHaveBeenCalled()
  })

  test('non-admin flattens permission slugs across all roles into a Set', async () => {
    const user = {
      role: 'user',
      getRoles: jest.fn().mockResolvedValue([
        { permissions: [{ slug: 'users.edit' }, { slug: 'users.view' }] },
        { permissions: [{ slug: 'users.view' }] }, // duplicate collapses in the Set
      ]),
    }
    const perms = await resolvePermissions(user)
    expect([...perms].sort()).toEqual(['users.edit', 'users.view'])
  })

  test('folds HRMS-role grants (from the linked employee) into the effective set', async () => {
    employeePermissionSlugs.mockResolvedValue(['hrms.payroll.run'])
    const user = {
      id: 'u1', role: 'user',
      getRoles: jest.fn().mockResolvedValue([{ permissions: [{ slug: 'users.view' }] }]),
    }
    const perms = await resolvePermissions(user)
    expect([...perms].sort()).toEqual(['hrms.payroll.run', 'users.view'])
    expect(employeePermissionSlugs).toHaveBeenCalledWith('u1')
  })
})

describe('permission.requirePermission', () => {
  test('401 when unauthenticated', async () => {
    const res = makeRes()
    const next = jest.fn()
    await requirePermission('users.edit')({}, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  test('system admin passes any check via the wildcard', async () => {
    const res = makeRes()
    const next = jest.fn()
    await requirePermission('users.delete')({ user: { role: 'admin' } }, res, next)
    expect(next).toHaveBeenCalled()
  })

  test('passes when the user holds ANY of the listed slugs', async () => {
    const user = { role: 'user', getRoles: jest.fn().mockResolvedValue([{ permissions: [{ slug: 'users.view' }] }]) }
    const res = makeRes()
    const next = jest.fn()
    await requirePermission('users.edit', 'users.view')({ user }, res, next)
    expect(next).toHaveBeenCalled()
  })

  test('403 when the user holds none of the listed slugs', async () => {
    const user = { role: 'user', getRoles: jest.fn().mockResolvedValue([{ permissions: [{ slug: 'reports.view' }] }]) }
    const res = makeRes()
    const next = jest.fn()
    await requirePermission('users.edit')({ user }, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  test('fails closed when mounted with no slugs (route misconfiguration)', async () => {
    // requirePermission() with an empty list can only be a wiring mistake; a
    // non-admin must still get 403 rather than the check degrading to a pass.
    const user = { role: 'user', getRoles: jest.fn().mockResolvedValue([{ permissions: [{ slug: 'users.view' }] }]) }
    const res = makeRes()
    const next = jest.fn()
    await requirePermission()({ user }, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  test('grants access via an HRMS-only slug the user holds via their employee record', async () => {
    employeePermissionSlugs.mockResolvedValue(['hrms.employees.edit'])
    const user = { id: 'u1', role: 'user', getRoles: jest.fn().mockResolvedValue([]) } // no platform perms
    const res = makeRes()
    const next = jest.fn()
    await requirePermission('hrms.employees.edit')({ user }, res, next)
    expect(next).toHaveBeenCalled()
  })

  test('500 when resolving permissions throws', async () => {
    const user = { role: 'user', getRoles: jest.fn().mockRejectedValue(new Error('db down')) }
    const res = makeRes()
    const next = jest.fn()
    await requirePermission('users.edit')({ user }, res, next)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(next).not.toHaveBeenCalled()
  })
})
