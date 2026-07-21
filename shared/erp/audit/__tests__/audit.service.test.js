// Unit tests for audit.service.
//
// Two things matter here:
//   1. log() MUST NOT throw — audit failures cannot break the business
//      operation that triggered them. We assert that explicitly.
//   2. The user-resolution logic: callers can pass `user`, `userId`, or
//      neither; org id defaults to user.organizationId, else user.id
//      (self-org), and a missing email gets looked up via User.findByPk.

const mockLoggerError = jest.fn()

jest.mock('../../../../server/models', () => ({
  AuditLog: {
    findAndCountAll: jest.fn(),
    create:          jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
  },
}))

jest.mock('../../../../server/core/logger', () => ({
  forLabel: () => ({ error: mockLoggerError }),
}))

const { Op } = require('sequelize')
const { AuditLog, User } = require('../../../../server/models')
const service = require('../audit.service')

describe('audit.log — user resolution', () => {
  test('prefers fully-supplied fields and skips the user lookup', async () => {
    AuditLog.create.mockResolvedValue({})
    await service.log({
      user: { id: 'u', organizationId: 'org-1', email: 'me@x.com' },
      action: 'invoice.send', entityType: 'Invoice', entityId: 'i1',
      summary: { from: 'draft', to: 'sent' },
    })
    expect(User.findByPk).not.toHaveBeenCalled()
    const row = AuditLog.create.mock.calls[0][0]
    expect(row).toMatchObject({
      userId: 'u',
      userEmail: 'me@x.com',
      organizationId: 'org-1',
      action: 'invoice.send',
      entityType: 'Invoice',
      entityId: 'i1',
      summary: { from: 'draft', to: 'sent' },
    })
  })

  test('only userId supplied → looks up user to derive org + email', async () => {
    AuditLog.create.mockResolvedValue({})
    User.findByPk.mockResolvedValue({ id: 'u', organizationId: 'org-1', email: 'me@x.com' })
    await service.log({ userId: 'u', action: 'x', entityType: 'Y' })
    expect(User.findByPk).toHaveBeenCalledWith('u', { attributes: ['id', 'organizationId', 'email'] })
    expect(AuditLog.create.mock.calls[0][0]).toMatchObject({
      userId: 'u', userEmail: 'me@x.com', organizationId: 'org-1',
    })
  })

  test('user without organizationId falls back to self-org (user.id)', async () => {
    AuditLog.create.mockResolvedValue({})
    User.findByPk.mockResolvedValue({ id: 'u-self', organizationId: null, email: 'me@x.com' })
    await service.log({ userId: 'u-self', action: 'x', entityType: 'Y' })
    expect(AuditLog.create.mock.calls[0][0].organizationId).toBe('u-self')
  })

  test('explicit organizationId wins over user.organizationId', async () => {
    AuditLog.create.mockResolvedValue({})
    await service.log({
      user: { id: 'u', organizationId: 'belongs-to-u', email: 'm@x' },
      organizationId: 'override',
      action: 'x', entityType: 'Y',
    })
    expect(AuditLog.create.mock.calls[0][0].organizationId).toBe('override')
  })

  test('no user info at all → creates row with null user fields', async () => {
    AuditLog.create.mockResolvedValue({})
    await service.log({ action: 'system.boot', entityType: 'System' })
    expect(User.findByPk).not.toHaveBeenCalled()
    expect(AuditLog.create.mock.calls[0][0]).toMatchObject({
      userId: null, userEmail: null, organizationId: null,
    })
  })

  test('entityId and summary default to null when omitted', async () => {
    AuditLog.create.mockResolvedValue({})
    await service.log({ user: { id: 'u', organizationId: 'o', email: 'e' }, action: 'x', entityType: 'Y' })
    const row = AuditLog.create.mock.calls[0][0]
    expect(row.entityId).toBeNull()
    expect(row.summary).toBeNull()
  })
})

describe('audit.log — never throws', () => {
  test('swallows AuditLog.create rejection and logs the failure instead', async () => {
    AuditLog.create.mockRejectedValue(new Error('db down'))
    await expect(service.log({ user: { id: 'u' }, action: 'x', entityType: 'Y' })).resolves.toBeUndefined()
    expect(mockLoggerError).toHaveBeenCalledWith(
      'failed to record event',
      expect.objectContaining({ action: 'x', error: 'db down' }),
    )
  })

  test('swallows User.findByPk rejection (still does not throw)', async () => {
    User.findByPk.mockRejectedValue(new Error('user lookup boom'))
    AuditLog.create.mockResolvedValue({}) // would-be-create never runs
    await expect(service.log({ userId: 'u', action: 'x', entityType: 'Y' })).resolves.toBeUndefined()
    expect(mockLoggerError).toHaveBeenCalled()
  })
})

describe('audit.logStrict — transactional writes', () => {
  test('writes inside the supplied transaction and propagates failures', async () => {
    const transaction = { id: 'tx-1' }
    AuditLog.create.mockRejectedValueOnce(new Error('db down'))

    await expect(service.logStrict({
      user: { id: 'u', organizationId: 'o', email: 'e@x.com' },
      action: 'hrms.employee.access.offboarded',
      entityType: 'Employee',
      entityId: 'e1',
    }, { transaction })).rejects.toThrow('db down')

    expect(AuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'u',
      organizationId: 'o',
      action: 'hrms.employee.access.offboarded',
    }), { transaction })
  })
})

describe('audit.list', () => {
  beforeEach(() => {
    AuditLog.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
  })

  test('paginates and returns { total, page, limit, logs } shape', async () => {
    AuditLog.findAndCountAll.mockResolvedValueOnce({ count: 12, rows: [{ id: 'a1' }] })
    const out = await service.list({ page: 2, limit: 5, organizationId: 'org-1' })
    expect(out).toEqual({ total: 12, page: 2, limit: 5, logs: [{ id: 'a1' }] })
    const args = AuditLog.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(5)
    expect(args.where.organizationId).toBe('org-1')
    expect(args.order).toEqual([['createdAt', 'DESC']])
  })

  test('applies exact-match filters on entityType / entityId / userId', async () => {
    await service.list({
      entityType: 'Invoice', entityId: 'i1', userId: 'u', organizationId: 'o',
    })
    const w = AuditLog.findAndCountAll.mock.calls[0][0].where
    expect(w.entityType).toBe('Invoice')
    expect(w.entityId).toBe('i1')
    expect(w.userId).toBe('u')
  })

  test('applies LIKE on action so prefix matches work', async () => {
    await service.list({ action: 'invoice.', organizationId: 'o' })
    const w = AuditLog.findAndCountAll.mock.calls[0][0].where
    expect(w.action[Op.like]).toBe('%invoice.%')
  })

  test('dateFrom / dateTo build a [gte, lte] range with the dateTo end-of-day bound', async () => {
    await service.list({ dateFrom: '2025-01-01', dateTo: '2025-01-31', organizationId: 'o' })
    const range = AuditLog.findAndCountAll.mock.calls[0][0].where.createdAt
    expect(range[Op.gte]).toBeInstanceOf(Date)
    expect(range[Op.lte]).toBeInstanceOf(Date)
    // Upper bound is end-of-day on dateTo (23:59:59.999Z)
    expect(range[Op.lte].toISOString()).toMatch(/2025-01-31T23:59:59\.999Z/)
  })

  test('no createdAt filter when neither date is supplied', async () => {
    await service.list({ organizationId: 'o' })
    expect(AuditLog.findAndCountAll.mock.calls[0][0].where).not.toHaveProperty('createdAt')
  })

  test('defaults: page=1, limit=50 (offset=0), null tenant', async () => {
    await service.list({})
    const args = AuditLog.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(0)
    expect(args.limit).toBe(50)
    expect(args.where.organizationId).toBeNull()
  })
})
