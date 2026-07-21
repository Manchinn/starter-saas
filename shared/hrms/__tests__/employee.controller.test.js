// Unit tests for hrms/employee.controller organization scoping.

jest.mock('../services/employee.service', () => ({
  listAssignableRoles: jest.fn(),
  list: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  offboard: jest.fn(),
  listAccessHistory: jest.fn(),
}))

jest.mock('../../../server/core/response', () => ({
  ok: jest.fn((res, data, message, status = 200) => ({ status, data, message })),
  created: jest.fn((res, data, message) => ({ status: 201, data, message })),
  fail: jest.fn((res, message, status = 400) => ({ status, message })),
  serverError: jest.fn(() => ({ status: 500 })),
}))

const service = require('../services/employee.service')
const { ok, fail } = require('../../../server/core/response')
const controller = require('../controllers/employee.controller')

function makeRes() {
  return {}
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('employee.controller organization scoping', () => {
  test('list: non-admin ignores query organizationId and uses own org', async () => {
    service.list.mockResolvedValue({ employees: [], total: 0 })
    const req = {
      user: { id: 'u1', role: 'user', organizationId: 'org-self' },
      query: { organizationId: 'org-other', page: '1', limit: '20', departmentId: 'd1' },
    }

    await controller.list(req, makeRes())

    expect(service.list).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: 'org-self',
      departmentId: 'd1',
    }))
    expect(ok).toHaveBeenCalled()
  })

  test('list: admin may target query organizationId', async () => {
    service.list.mockResolvedValue({ employees: [{ id: 'e1' }], total: 1 })
    const req = {
      user: { id: 'admin', role: 'admin', organizationId: null },
      query: { organizationId: 'org-target', departmentId: 'd9' },
    }

    await controller.list(req, makeRes())

    expect(service.list).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: 'org-target',
      departmentId: 'd9',
    }))
  })

  test('getById / accessHistory / remove: admin honors query organizationId', async () => {
    service.getById.mockResolvedValue({ id: 'e1' })
    service.listAccessHistory.mockResolvedValue({ logs: [] })
    service.remove.mockResolvedValue(undefined)

    const adminReq = {
      user: { id: 'admin', role: 'admin' },
      params: { id: 'e1' },
      query: { organizationId: 'org-target', page: '2', limit: '10' },
    }

    await controller.getById(adminReq, makeRes())
    await controller.accessHistory(adminReq, makeRes())
    await controller.remove(adminReq, makeRes())

    expect(service.getById).toHaveBeenCalledWith('e1', 'org-target')
    expect(service.listAccessHistory).toHaveBeenCalledWith('e1', 'org-target', { page: 2, limit: 10 })
    expect(service.remove).toHaveBeenCalledWith('e1', 'org-target')
  })

  test('create / update / offboard: admin prefers body organizationId', async () => {
    service.create.mockResolvedValue({ id: 'e1' })
    service.update.mockResolvedValue({ id: 'e1' })
    service.offboard.mockResolvedValue({ employeeId: 'e1' })

    const admin = { id: 'admin', role: 'admin' }

    await controller.create({
      user: admin,
      body: { firstName: 'A', lastName: 'B', organizationId: 'org-body' },
      query: {},
    }, makeRes())

    await controller.update({
      user: admin,
      params: { id: 'e1' },
      body: { firstName: 'A', organizationId: 'org-body' },
      query: { organizationId: 'org-query' },
    }, makeRes())

    await controller.offboard({
      user: admin,
      params: { id: 'e1' },
      body: { organizationId: 'org-body', activeTo: '2026-07-21' },
      query: {},
    }, makeRes())

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: 'org-body',
      actor: admin,
    }))
    expect(service.update).toHaveBeenCalledWith(
      'e1',
      expect.objectContaining({ organizationId: 'org-body' }),
      'org-body',
      'admin',
      admin,
    )
    expect(service.offboard).toHaveBeenCalledWith('e1', 'org-body', 'admin', admin, '2026-07-21')
  })

  test('list surfaces service failures with status', async () => {
    service.list.mockRejectedValue({ status: 403, message: 'Not allowed' })
    const req = {
      user: { id: 'u1', role: 'user', organizationId: 'org-self' },
      query: {},
    }

    await controller.list(req, makeRes())

    expect(fail).toHaveBeenCalledWith(expect.anything(), 'Not allowed', 403)
  })
})
