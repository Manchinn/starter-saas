// Unit tests for the revised audit.service (1M-record data store).
//
// What matters here:
//   1. log() MUST NOT throw — audit failures cannot break the business
//      operation that triggered them.
//   2. Writes are buffered: log() enqueues; flushNow() persists via bulkCreate;
//      the buffer auto-flushes at batchSize.
//   3. The user-resolution logic is preserved (user | userId | neither).
//   4. list() uses keyset pagination (no offset, no per-page COUNT unless
//      withCount), returning { logs, nextCursor, hasMore, total }.
//   5. pruneExpiredLogs() deletes past the retention horizon and is a no-op
//      when disabled.

const mockLoggerError = jest.fn()
const mockLoggerInfo  = jest.fn()

jest.mock('../../../../server/config/config', () => ({
  audit: { batchSize: 3, flushIntervalMs: 1000, maxSummaryBytes: 50, retentionDays: 365 },
}))

jest.mock('../../../../server/models', () => ({
  AuditLog: {
    findAll:    jest.fn(),
    count:      jest.fn(),
    bulkCreate: jest.fn().mockResolvedValue([]),
    destroy:    jest.fn(),
  },
  User: { findByPk: jest.fn() },
}))

jest.mock('../../../../server/core/logger', () => ({
  forLabel: () => ({ error: mockLoggerError, info: mockLoggerInfo }),
}))

const { Op } = require('sequelize')
const config = require('../../../../server/config/config')
const { AuditLog, User } = require('../../../../server/models')
const service = require('../audit.service')

const fullUser = { id: 'u', organizationId: 'org-1', email: 'me@x.com' }

beforeEach(async () => {
  jest.clearAllMocks()
  AuditLog.bulkCreate.mockResolvedValue([])
  await service.flushNow() // drain any rows left over from a prior test
  AuditLog.bulkCreate.mockClear()
})

describe('log — buffering & flush', () => {
  test('enqueues and persists via bulkCreate on flushNow', async () => {
    await service.log({ user: fullUser, action: 'invoice.send', entityType: 'Invoice', entityId: 'i1', summary: { to: 'sent' } })
    expect(AuditLog.bulkCreate).not.toHaveBeenCalled() // buffered, not yet written
    await service.flushNow()
    expect(AuditLog.bulkCreate).toHaveBeenCalledTimes(1)
    const batch = AuditLog.bulkCreate.mock.calls[0][0]
    expect(batch).toHaveLength(1)
    expect(batch[0]).toMatchObject({
      userId: 'u', userEmail: 'me@x.com', organizationId: 'org-1',
      action: 'invoice.send', entityType: 'Invoice', entityId: 'i1', summary: { to: 'sent' },
    })
    expect(batch[0].createdAt).toBeInstanceOf(Date)
  })

  test('auto-flushes when the buffer reaches batchSize (3)', async () => {
    await service.log({ user: fullUser, action: 'a', entityType: 'X' })
    await service.log({ user: fullUser, action: 'b', entityType: 'X' })
    expect(AuditLog.bulkCreate).not.toHaveBeenCalled()
    await service.log({ user: fullUser, action: 'c', entityType: 'X' }) // 3rd → flush
    expect(AuditLog.bulkCreate).toHaveBeenCalledTimes(1)
    expect(AuditLog.bulkCreate.mock.calls[0][0]).toHaveLength(3)
  })

  test('flushNow is a no-op when the buffer is empty', async () => {
    await service.flushNow()
    expect(AuditLog.bulkCreate).not.toHaveBeenCalled()
  })

  test('caps oversized summaries to a marker', async () => {
    const big = { blob: 'x'.repeat(200) } // exceeds maxSummaryBytes: 50
    await service.log({ user: fullUser, action: 'a', entityType: 'X', summary: big })
    await service.flushNow()
    expect(AuditLog.bulkCreate.mock.calls[0][0][0].summary).toMatchObject({ truncated: true })
  })
})

describe('log — user resolution', () => {
  test('prefers fully-supplied fields and skips the user lookup', async () => {
    await service.log({ user: fullUser, action: 'x', entityType: 'Y' })
    expect(User.findByPk).not.toHaveBeenCalled()
    await service.flushNow()
    expect(AuditLog.bulkCreate.mock.calls[0][0][0]).toMatchObject({ userId: 'u', userEmail: 'me@x.com', organizationId: 'org-1' })
  })

  test('only userId supplied → looks up user to derive org + email', async () => {
    User.findByPk.mockResolvedValue({ id: 'u', organizationId: 'org-1', email: 'me@x.com' })
    await service.log({ userId: 'u', action: 'x', entityType: 'Y' })
    expect(User.findByPk).toHaveBeenCalledWith('u', { attributes: ['id', 'organizationId', 'email'] })
    await service.flushNow()
    expect(AuditLog.bulkCreate.mock.calls[0][0][0]).toMatchObject({ userId: 'u', userEmail: 'me@x.com', organizationId: 'org-1' })
  })

  test('user without organizationId falls back to self-org (user.id)', async () => {
    User.findByPk.mockResolvedValue({ id: 'u-self', organizationId: null, email: 'me@x.com' })
    await service.log({ userId: 'u-self', action: 'x', entityType: 'Y' })
    await service.flushNow()
    expect(AuditLog.bulkCreate.mock.calls[0][0][0].organizationId).toBe('u-self')
  })

  test('explicit organizationId wins over user.organizationId', async () => {
    await service.log({ user: fullUser, organizationId: 'override', action: 'x', entityType: 'Y' })
    await service.flushNow()
    expect(AuditLog.bulkCreate.mock.calls[0][0][0].organizationId).toBe('override')
  })

  test('no user info at all → row with null user fields', async () => {
    await service.log({ action: 'system.boot', entityType: 'System' })
    expect(User.findByPk).not.toHaveBeenCalled()
    await service.flushNow()
    expect(AuditLog.bulkCreate.mock.calls[0][0][0]).toMatchObject({ userId: null, userEmail: null, organizationId: null })
  })

  test('entityId and summary default to null when omitted', async () => {
    await service.log({ user: fullUser, action: 'x', entityType: 'Y' })
    await service.flushNow()
    const row = AuditLog.bulkCreate.mock.calls[0][0][0]
    expect(row.entityId).toBeNull()
    expect(row.summary).toBeNull()
  })
})

describe('log / flush — never throws', () => {
  test('swallows a failed flush and logs it', async () => {
    AuditLog.bulkCreate.mockRejectedValueOnce(new Error('db down'))
    await service.log({ user: fullUser, action: 'x', entityType: 'Y' })
    await expect(service.flushNow()).resolves.toBeUndefined()
    expect(mockLoggerError).toHaveBeenCalledWith('failed to flush batch', expect.objectContaining({ error: 'db down' }))
  })

  test('swallows User.findByPk rejection (log still resolves)', async () => {
    User.findByPk.mockRejectedValue(new Error('user lookup boom'))
    await expect(service.log({ userId: 'u', action: 'x', entityType: 'Y' })).resolves.toBeUndefined()
    expect(mockLoggerError).toHaveBeenCalled()
  })
})

describe('list — keyset pagination', () => {
  beforeEach(() => { AuditLog.findAll.mockResolvedValue([]) })

  test('orders by (createdAt DESC, id DESC) and fetches limit+1', async () => {
    await service.list({ limit: 2, organizationId: 'org-1' })
    const args = AuditLog.findAll.mock.calls[0][0]
    expect(args.limit).toBe(3)
    expect(args.order).toEqual([['createdAt', 'DESC'], ['id', 'DESC']])
    expect(args.where.organizationId).toBe('org-1')
  })

  test('hasMore + nextCursor when an extra row is returned', async () => {
    const d = new Date('2025-01-03T00:00:00.000Z')
    AuditLog.findAll.mockResolvedValue([
      { id: 'r1', createdAt: d }, { id: 'r2', createdAt: d }, { id: 'r3', createdAt: d },
    ])
    const out = await service.list({ limit: 2, organizationId: 'o' })
    expect(out.hasMore).toBe(true)
    expect(out.logs).toHaveLength(2)
    expect(out.nextCursor).toBe(service.encodeCursor(out.logs[1]))
    expect(out.total).toBeUndefined()
  })

  test('no extra row → hasMore false, nextCursor null', async () => {
    AuditLog.findAll.mockResolvedValue([{ id: 'r1', createdAt: new Date() }])
    const out = await service.list({ limit: 2, organizationId: 'o' })
    expect(out.hasMore).toBe(false)
    expect(out.nextCursor).toBeNull()
  })

  test('withCount runs an exact count of the filtered set', async () => {
    AuditLog.count.mockResolvedValue(42)
    const out = await service.list({ limit: 2, organizationId: 'o', withCount: true })
    expect(AuditLog.count).toHaveBeenCalled()
    expect(out.total).toBe(42)
  })

  test('applies filters: entityType/entityId/userId exact, action LIKE, date range', async () => {
    await service.list({ entityType: 'Invoice', entityId: 'i1', userId: 'u', action: 'send', dateFrom: '2025-01-01', dateTo: '2025-01-31', organizationId: 'o' })
    const w = AuditLog.findAll.mock.calls[0][0].where
    expect(w.entityType).toBe('Invoice')
    expect(w.entityId).toBe('i1')
    expect(w.userId).toBe('u')
    expect(w.action[Op.like]).toBe('%send%')
    expect(w.createdAt[Op.gte]).toBeInstanceOf(Date)
    expect(w.createdAt[Op.lte].toISOString()).toMatch(/2025-01-31T23:59:59\.999Z/)
  })

  test('a cursor adds a keyset (createdAt,id) < cursor clause', async () => {
    const cursor = service.encodeCursor({ id: 'r2', createdAt: new Date('2025-01-02T00:00:00.000Z') })
    await service.list({ limit: 2, organizationId: 'o', cursor })
    const w = AuditLog.findAll.mock.calls[0][0].where
    expect(w[Op.and]).toBeDefined()
    expect(w[Op.and][0][Op.or]).toHaveLength(2)
  })

  test('a malformed cursor is ignored (no keyset clause)', async () => {
    await service.list({ limit: 2, organizationId: 'o', cursor: 'not-base64-json' })
    expect(AuditLog.findAll.mock.calls[0][0].where[Op.and]).toBeUndefined()
  })
})

describe('cursor encode/decode roundtrip', () => {
  test('encode then decode preserves createdAt + id', () => {
    const row = { id: 'abc', createdAt: new Date('2025-06-01T12:00:00.000Z') }
    const decoded = service.decodeCursor(service.encodeCursor(row))
    expect(decoded.id).toBe('abc')
    expect(decoded.createdAt.toISOString()).toBe('2025-06-01T12:00:00.000Z')
  })

  test('decode returns null for junk', () => {
    expect(service.decodeCursor('@@@')).toBeNull()
    expect(service.decodeCursor('')).toBeNull()
  })
})

describe('pruneExpiredLogs', () => {
  afterEach(() => { config.audit.retentionDays = 365 })

  test('deletes rows older than retentionDays', async () => {
    AuditLog.destroy.mockResolvedValue(7)
    const removed = await service.pruneExpiredLogs()
    expect(removed).toBe(7)
    const where = AuditLog.destroy.mock.calls[0][0].where
    expect(where.createdAt[Op.lt]).toBeInstanceOf(Date)
  })

  test('no-op when retention is disabled (0)', async () => {
    config.audit.retentionDays = 0
    const removed = await service.pruneExpiredLogs()
    expect(removed).toBe(0)
    expect(AuditLog.destroy).not.toHaveBeenCalled()
  })

  test('never throws — swallows a destroy failure', async () => {
    AuditLog.destroy.mockRejectedValue(new Error('boom'))
    await expect(service.pruneExpiredLogs()).resolves.toBe(0)
    expect(mockLoggerError).toHaveBeenCalled()
  })
})
