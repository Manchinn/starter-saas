// Security tests for core/realtime — the Socket.IO layer.
//
// Three properties matter here:
//   1. The handshake is authenticated with the same JWT + active-account rules
//      as the REST API — no token, a bad token, or an inactive account must be
//      refused before any room is joined.
//   2. Room membership is scoped: everyone joins only their own org's room;
//      the admin room is admins-only; module rooms are skipped for admins
//      (they already see everything via the admin room).
//   3. Alert emissions carry a MINIMAL payload (id/title/severity/scope) to the
//      scope-derived rooms only — never the full alert body, and nothing at all
//      when the alert has no organizationId to scope by.
//
// socket.io, jwt, models and the alert service are mocked; we drive the
// captured middleware/connection handlers directly.

jest.mock('socket.io', () => ({ Server: jest.fn() }))
jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }))
jest.mock('../../config/config', () => ({
  clientUrl: 'http://app.test',
  jwt: { secret: 'test-secret' },
}))
jest.mock('../../models', () => ({ User: { findByPk: jest.fn() } }))
jest.mock('../logger', () => ({ forLabel: () => ({ info: jest.fn(), error: jest.fn() }) }))
jest.mock('../../../shared/erp/alert/services/alert.service', () => ({
  getUserDepartmentIds: jest.fn(),
  getUserModuleSlugs:   jest.fn(),
}))

const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const { User } = require('../../models')
const alertSvc = require('../../../shared/erp/alert/services/alert.service')

// Fresh module state per test (realtime keeps `io` in module scope).
let realtime
let ioStub
let authMiddleware
let connectionHandler
let emitted

const initRealtime = () => {
  jest.isolateModules(() => { realtime = require('../realtime') })
  emitted = []
  ioStub = {
    use: jest.fn((fn) => { authMiddleware = fn }),
    on:  jest.fn((ev, fn) => { if (ev === 'connection') connectionHandler = fn }),
    attach: jest.fn(),
    to: jest.fn((room) => ({ emit: (event, payload) => emitted.push({ room, event, payload }) })),
  }
  Server.mockImplementation(() => ioStub)
  realtime.init({ fake: 'server' })
}

const makeSocket = (over = {}) => ({
  handshake: { auth: { token: 'tok' } },
  join: jest.fn(),
  ...over,
})

beforeEach(() => {
  jest.clearAllMocks()
  alertSvc.getUserDepartmentIds.mockResolvedValue([])
  alertSvc.getUserModuleSlugs.mockResolvedValue([])
  initRealtime()
})

describe('realtime — handshake authentication', () => {
  test('refuses a connection with no token', async () => {
    const next = jest.fn()
    await authMiddleware(makeSocket({ handshake: { auth: {} } }), next)
    expect(next).toHaveBeenCalledWith(expect.any(Error))
    expect(next.mock.calls[0][0].message).toBe('Authentication required')
  })

  test('refuses a connection whose token fails verification', async () => {
    jwt.verify.mockImplementation(() => { throw new Error('bad signature') })
    const next = jest.fn()
    await authMiddleware(makeSocket(), next)
    expect(next.mock.calls[0][0].message).toBe('Authentication failed')
  })

  test('refuses a missing or inactive account even with a valid token', async () => {
    jwt.verify.mockReturnValue({ id: 'u1' })
    User.findByPk.mockResolvedValue({ id: 'u1', isActive: false })
    const next = jest.fn()
    await authMiddleware(makeSocket(), next)
    expect(next.mock.calls[0][0].message).toBe('Invalid account')
  })

  test('verifies against the API JWT secret and attaches the user on success', async () => {
    jwt.verify.mockReturnValue({ id: 'u1' })
    const user = { id: 'u1', isActive: true }
    User.findByPk.mockResolvedValue(user)
    const socket = makeSocket()
    const next = jest.fn()
    await authMiddleware(socket, next)
    expect(jwt.verify).toHaveBeenCalledWith('tok', 'test-secret')
    expect(socket.user).toBe(user)
    expect(next).toHaveBeenCalledWith() // no error argument
  })
})

describe('realtime — room scoping on connection', () => {
  test('a staff member joins their org room plus dept/module rooms — never the admin room', async () => {
    alertSvc.getUserDepartmentIds.mockResolvedValue(['d1'])
    alertSvc.getUserModuleSlugs.mockResolvedValue(['erp'])
    const socket = makeSocket({ user: { id: 'u1', role: 'user', organizationId: 'org-1' } })
    await connectionHandler(socket)
    const rooms = socket.join.mock.calls.map((c) => c[0])
    expect(rooms).toEqual(expect.arrayContaining(['org:org-1', 'dept:d1', 'mod:org-1:erp']))
    expect(rooms.some((r) => r.startsWith('orgadmin:'))).toBe(false)
  })

  test('an org-level user is scoped by their own id as the org key', async () => {
    const socket = makeSocket({ user: { id: 'org-1', role: 'user', organizationId: null } })
    await connectionHandler(socket)
    expect(socket.join).toHaveBeenCalledWith('org:org-1')
  })

  test('an admin joins the admin room and skips module rooms', async () => {
    alertSvc.getUserModuleSlugs.mockResolvedValue(['erp'])
    const socket = makeSocket({ user: { id: 'a1', role: 'admin', organizationId: null } })
    await connectionHandler(socket)
    const rooms = socket.join.mock.calls.map((c) => c[0])
    expect(rooms).toEqual(expect.arrayContaining(['org:a1', 'orgadmin:a1']))
    expect(alertSvc.getUserModuleSlugs).not.toHaveBeenCalled()
    expect(rooms.some((r) => r.startsWith('mod:'))).toBe(false)
  })

  test('a failure while joining scoped rooms is contained (no crash, base room kept)', async () => {
    alertSvc.getUserDepartmentIds.mockRejectedValue(new Error('db down'))
    const socket = makeSocket({ user: { id: 'u1', role: 'user', organizationId: 'org-1' } })
    await expect(connectionHandler(socket)).resolves.toBeUndefined()
    expect(socket.join).toHaveBeenCalledWith('org:org-1')
  })
})

describe('realtime — emitAlertsChanged payload and targeting', () => {
  const baseAlert = {
    id: 'al-1', title: 'Stock low', severity: 'warning',
    body: 'SECRET internal details', createdBy: 'u9',
    organizationId: 'org-1', scope: 'global',
  }

  test('emits a MINIMAL payload — the alert body and author never leave the server', () => {
    realtime.emitAlertsChanged(baseAlert, 'new')
    expect(emitted).toHaveLength(1)
    const { room, event, payload } = emitted[0]
    expect(room).toBe('org:org-1')
    expect(event).toBe('alerts:changed')
    expect(payload.alert).toEqual({ id: 'al-1', title: 'Stock low', severity: 'warning', scope: 'global' })
    expect(JSON.stringify(payload)).not.toContain('SECRET')
    expect(JSON.stringify(payload)).not.toContain('u9')
  })

  test('a department-scoped alert goes to the department + org-admin rooms only', () => {
    realtime.emitAlertsChanged({ ...baseAlert, scope: 'department', departmentId: 'd1' })
    expect(emitted.map((e) => e.room).sort()).toEqual(['dept:d1', 'orgadmin:org-1'])
  })

  test('a module-scoped alert goes to the module + org-admin rooms only', () => {
    realtime.emitAlertsChanged({ ...baseAlert, scope: 'module', moduleSlug: 'erp' })
    expect(emitted.map((e) => e.room).sort()).toEqual(['mod:org-1:erp', 'orgadmin:org-1'])
  })

  test('emits nothing for an alert with no organizationId (no unscoped broadcast)', () => {
    realtime.emitAlertsChanged({ ...baseAlert, organizationId: null })
    expect(emitted).toHaveLength(0)
  })

  test('is a no-op before init (no crash when Socket.IO is not attached)', () => {
    jest.isolateModules(() => { realtime = require('../realtime') }) // fresh, un-inited
    expect(() => realtime.emitAlertsChanged(baseAlert)).not.toThrow()
  })
})
