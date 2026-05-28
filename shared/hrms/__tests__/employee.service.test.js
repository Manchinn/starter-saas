// Unit tests for hrms/employee.service.
//
// The interesting paths: organizationId is always required, create supports
// three credential modes (existing user, new user, none), the User↔Employee
// link is unique, and the departments junction is only touched when the
// caller explicitly passes departmentIds.

jest.mock('../../../server/models', () => ({
  Employee:   { findAndCountAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  User:       { findByPk: jest.fn() },
  Department: {},
}))

jest.mock('../../erp/settings/services/sequence.service', () => ({
  getNext: jest.fn(),
}), { virtual: true })

jest.mock('../../../server/modules/organizations/organization.service', () => ({
  create: jest.fn(),
}), { virtual: true })

const { Op } = require('sequelize')
const { Employee, User } = require('../../../server/models')
const seqService = require('../../erp/settings/services/sequence.service')
const organizationService = require('../../../server/modules/organizations/organization.service')
const service = require('../services/employee.service')

describe('employee.list', () => {
  test('rejects when organizationId is missing', async () => {
    await expect(service.list({})).rejects.toEqual({ status: 400, message: 'Organization ID is required' })
  })

  test('paginates, scopes by org, excludes soft-deleted, eager-loads user + departments', async () => {
    Employee.findAndCountAll.mockResolvedValue({ count: 2, rows: [{ id: 'e1' }] })
    const out = await service.list({ organizationId: 'o', page: 2, limit: 5 })
    expect(out).toEqual({ total: 2, page: 2, limit: 5, employees: [{ id: 'e1' }] })
    const args = Employee.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(5)
    expect(args.where.organizationId).toBe('o')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.include.map(i => i.as).sort()).toEqual(['departments', 'user'])
  })

  test('search applies across firstName / lastName / employeeCode / position', async () => {
    Employee.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
    await service.list({ organizationId: 'o', search: 'smith' })
    const or = Employee.findAndCountAll.mock.calls[0][0].where[Op.or]
    expect(or).toHaveLength(4)
    expect(or.map(c => Object.keys(c)[0]).sort()).toEqual(['employeeCode', 'firstName', 'lastName', 'position'])
  })
})

describe('employee.getById', () => {
  test('throws 404 when missing', async () => {
    Employee.findOne.mockResolvedValue(null)
    await expect(service.getById('e1', 'o')).rejects.toEqual({ status: 404, message: 'Employee not found' })
  })

  test('omits org scoping when no organizationId passed', async () => {
    Employee.findOne.mockResolvedValue({ id: 'e1' })
    await service.getById('e1')
    expect(Employee.findOne.mock.calls[0][0].where).toEqual({ id: 'e1' })
  })
})

describe('employee.create — validation', () => {
  test('rejects missing org / firstName / lastName', async () => {
    await expect(service.create({ firstName: 'A', lastName: 'B' }))
      .rejects.toEqual({ status: 400, message: 'Organization ID is required' })
    await expect(service.create({ organizationId: 'o', lastName: 'B' }))
      .rejects.toEqual({ status: 400, message: 'First name is required' })
    await expect(service.create({ organizationId: 'o', firstName: 'A' }))
      .rejects.toEqual({ status: 400, message: 'Last name is required' })
  })
})

describe('employee.create — credential modes', () => {
  test('credentialMode "new" creates a User and links it', async () => {
    organizationService.create.mockResolvedValue({ id: 'new-user-id' })
    Employee.create.mockResolvedValue({ id: 'e1', setDepartments: jest.fn() })
    Employee.findOne.mockResolvedValue({ id: 'e1', userId: 'new-user-id' })

    await service.create({
      organizationId: 'o', firstName: '  Ada ', lastName: ' Lovelace ',
      credentialMode: 'new', email: '  a@b.com ', password: 'pw',
    })

    expect(organizationService.create).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'a@b.com',
      password: 'pw',
      role: 'user',
      organizationId: 'o',
    })
    expect(Employee.create.mock.calls[0][0].userId).toBe('new-user-id')
  })

  test('credentialMode "new" rejects missing email/password', async () => {
    await expect(service.create({ organizationId: 'o', firstName: 'A', lastName: 'B', credentialMode: 'new', password: 'pw' }))
      .rejects.toEqual({ status: 400, message: 'Email is required' })
    await expect(service.create({ organizationId: 'o', firstName: 'A', lastName: 'B', credentialMode: 'new', email: 'a@b' }))
      .rejects.toEqual({ status: 400, message: 'Password is required' })
  })

  test('existing-user mode validates user exists', async () => {
    User.findByPk.mockResolvedValue(null)
    await expect(service.create({
      organizationId: 'o', firstName: 'A', lastName: 'B', userId: 'missing',
    })).rejects.toEqual({ status: 404, message: 'Selected user account not found' })
  })

  test('existing-user mode rejects if user already linked to another employee', async () => {
    User.findByPk.mockResolvedValue({ id: 'u' })
    Employee.findOne.mockResolvedValue({ id: 'other-emp' })
    await expect(service.create({
      organizationId: 'o', firstName: 'A', lastName: 'B', userId: 'u',
    })).rejects.toEqual({ status: 409, message: 'This user account is already linked to another employee' })
  })

  test('no userId and credentialMode "existing" → emp gets userId: null', async () => {
    const emp = { id: 'e1', setDepartments: jest.fn() }
    Employee.create.mockResolvedValue(emp)
    Employee.findOne.mockResolvedValue({ id: 'e1' })
    await service.create({ organizationId: 'o', firstName: 'A', lastName: 'B' })
    expect(Employee.create.mock.calls[0][0].userId).toBeNull()
    expect(User.findByPk).not.toHaveBeenCalled()
  })
})

describe('employee.create — autoCode and departments', () => {
  test('autoCode uses the EMP sequence', async () => {
    seqService.getNext.mockResolvedValue('EMP-0007')
    Employee.create.mockResolvedValue({ id: 'e1', setDepartments: jest.fn() })
    Employee.findOne.mockResolvedValue({ id: 'e1' })
    await service.create({ organizationId: 'o', firstName: 'A', lastName: 'B', autoCode: true, createdByUserId: 'u' })
    expect(seqService.getNext).toHaveBeenCalledWith('EMP', 'u')
    expect(Employee.create.mock.calls[0][0].employeeCode).toBe('EMP-0007')
  })

  test('explicit employeeCode is trimmed', async () => {
    Employee.create.mockResolvedValue({ id: 'e1', setDepartments: jest.fn() })
    Employee.findOne.mockResolvedValue({ id: 'e1' })
    await service.create({ organizationId: 'o', firstName: 'A', lastName: 'B', employeeCode: '  E-9  ' })
    expect(Employee.create.mock.calls[0][0].employeeCode).toBe('E-9')
  })

  test('setDepartments only called when departmentIds is non-empty', async () => {
    const emp1 = { id: 'e1', setDepartments: jest.fn() }
    Employee.create.mockResolvedValue(emp1)
    Employee.findOne.mockResolvedValue({ id: 'e1' })
    await service.create({ organizationId: 'o', firstName: 'A', lastName: 'B' })
    expect(emp1.setDepartments).not.toHaveBeenCalled()

    const emp2 = { id: 'e2', setDepartments: jest.fn() }
    Employee.create.mockResolvedValue(emp2)
    await service.create({ organizationId: 'o', firstName: 'A', lastName: 'B', departmentIds: ['d1', 'd2'] })
    expect(emp2.setDepartments).toHaveBeenCalledWith(['d1', 'd2'])
  })
})

describe('employee.update', () => {
  test('throws 404 when employee not found in org', async () => {
    Employee.findOne.mockResolvedValue(null)
    await expect(service.update('e1', { firstName: 'x' }, 'o', 'u'))
      .rejects.toEqual({ status: 404, message: 'Employee not found' })
  })

  test('changing userId to one already taken by another employee → 409', async () => {
    const emp = { id: 'e1', userId: 'old', update: jest.fn() }
    Employee.findOne
      .mockResolvedValueOnce(emp)                       // initial lookup
      .mockResolvedValueOnce({ id: 'e-other' })         // duplicate-link check
    User.findByPk.mockResolvedValue({ id: 'new' })
    await expect(service.update('e1', { userId: 'new' }, 'o', 'u'))
      .rejects.toEqual({ status: 409, message: 'This user already has an employee record' })
  })

  test('userId change to a non-existent user → 404', async () => {
    const emp = { id: 'e1', userId: 'old', update: jest.fn() }
    Employee.findOne.mockResolvedValue(emp)
    User.findByPk.mockResolvedValue(null)
    await expect(service.update('e1', { userId: 'missing' }, 'o', 'u'))
      .rejects.toEqual({ status: 404, message: 'Selected user not found' })
  })

  test('only applies supplied fields (undefined skipped); empty string → null on optional text fields', async () => {
    const emp = {
      id: 'e1', userId: null,
      update:         jest.fn().mockResolvedValue(),
      setDepartments: jest.fn(),
    }
    Employee.findOne
      .mockResolvedValueOnce(emp)
      .mockResolvedValueOnce({ id: 'e1' })  // trailing getById
    await service.update('e1', {
      firstName: '  Ada ',
      position: '   ',  // empty after trim → null
      activeFrom: '',
      organizationId: '', // newOrgId is falsy → not in patch
    }, 'o', 'u')

    const patch = emp.update.mock.calls[0][0]
    expect(patch.firstName).toBe('Ada')
    expect(patch.position).toBeNull()
    expect(patch.activeFrom).toBeNull()
    expect(patch).not.toHaveProperty('organizationId') // empty new org skipped
    expect(patch.modifiedBy).toBe('u')
  })

  test('setDepartments runs whenever departmentIds is present, with [] clearing', async () => {
    const emp = {
      id: 'e1', userId: null,
      update:         jest.fn().mockResolvedValue(),
      setDepartments: jest.fn(),
    }
    Employee.findOne
      .mockResolvedValueOnce(emp)
      .mockResolvedValueOnce({ id: 'e1' })
    await service.update('e1', { departmentIds: [] }, 'o', 'u')
    expect(emp.setDepartments).toHaveBeenCalledWith([])
  })

  test('omitting departmentIds leaves the existing junction untouched', async () => {
    const emp = {
      id: 'e1', userId: null,
      update:         jest.fn().mockResolvedValue(),
      setDepartments: jest.fn(),
    }
    Employee.findOne
      .mockResolvedValueOnce(emp)
      .mockResolvedValueOnce({ id: 'e1' })
    await service.update('e1', { firstName: 'A' }, 'o', 'u')
    expect(emp.setDepartments).not.toHaveBeenCalled()
  })
})

describe('employee.remove', () => {
  test('throws 404 when not found in org', async () => {
    Employee.findOne.mockResolvedValue(null)
    await expect(service.remove('missing', 'o'))
      .rejects.toEqual({ status: 404, message: 'Employee not found' })
  })

  test('destroys when found', async () => {
    const emp = { destroy: jest.fn().mockResolvedValue() }
    Employee.findOne.mockResolvedValue(emp)
    await service.remove('e1', 'o')
    expect(emp.destroy).toHaveBeenCalled()
  })
})
