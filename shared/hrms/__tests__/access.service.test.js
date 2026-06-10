// Security tests for hrms/services/access.service.
//
// employeePermissionSlugs is an RBAC driver: it resolves the HRMS permission
// slugs a login User inherits via their linked Employee → HRMS roles. Those
// slugs are folded into the user's overall permission set by both the auth
// middleware and session resolution, so an over- or under-broad result is a
// direct authorization bug. Models are mocked — pure resolution logic.

jest.mock('../../../server/models', () => ({
  Employee:       { findOne: jest.fn() },
  HrmsRole:       {},
  HrmsPermission: {},
}))

const { Employee } = require('../../../server/models')
const { employeePermissionSlugs } = require('../services/access.service')

beforeEach(() => jest.clearAllMocks())

describe('employeePermissionSlugs — fail-closed defaults', () => {
  test('returns no slugs (and skips the DB) when there is no userId', async () => {
    await expect(employeePermissionSlugs(null)).resolves.toEqual([])
    await expect(employeePermissionSlugs(undefined)).resolves.toEqual([])
    expect(Employee.findOne).not.toHaveBeenCalled()
  })

  test('returns no slugs when the user has no linked employee', async () => {
    Employee.findOne.mockResolvedValue(null)
    await expect(employeePermissionSlugs('u1')).resolves.toEqual([])
  })

  test('returns no slugs when the employee has no roles', async () => {
    Employee.findOne.mockResolvedValue({ roles: null })
    await expect(employeePermissionSlugs('u1')).resolves.toEqual([])
  })

  test('tolerates a role with no permissions array without throwing', async () => {
    Employee.findOne.mockResolvedValue({ roles: [{ permissions: null }, {}] })
    await expect(employeePermissionSlugs('u1')).resolves.toEqual([])
  })
})

describe('employeePermissionSlugs — resolution', () => {
  test('flattens permission slugs across every attached HRMS role', async () => {
    Employee.findOne.mockResolvedValue({
      roles: [
        { permissions: [{ slug: 'hrms.employees.view' }, { slug: 'hrms.employees.edit' }] },
        { permissions: [{ slug: 'hrms.payroll.run' }] },
      ],
    })
    const slugs = await employeePermissionSlugs('u1')
    expect(slugs.sort()).toEqual(['hrms.employees.edit', 'hrms.employees.view', 'hrms.payroll.run'])
  })

  test('scopes the employee lookup by the supplied userId', async () => {
    Employee.findOne.mockResolvedValue(null)
    await employeePermissionSlugs('u-42')
    expect(Employee.findOne.mock.calls[0][0].where).toEqual({ userId: 'u-42' })
  })
})
