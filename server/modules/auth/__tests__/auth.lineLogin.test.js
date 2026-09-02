// Unit + route tests for modules/auth.lineLogin (server-side LINE login).
//
// The LINE flow verifies an ID token server-side, then find-or-creates a platform
// User keyed by the LINE `sub` claim. jwt, config, models, mailer and the logger
// are mocked so nothing is actually signed, mailed, or persisted. Global `fetch`
// (the LINE OAuth verify call) is mocked so the OAuth round-trip never leaves the
// process. We cover the guard branches (unconfigured channel, missing/malformed
// token, aud mismatch), the happy paths (find-existing, create-new, account-link),
// the race-safe create (unique violation → refetch, never an unhandled 500), the
// upstream-failure branch (clean 502, no internal message leak), the synthetic-email
// collision fallback, and a full POST /api/auth/line ride through router+controller.
// The migration idempotency + UNIQUE index is verified against a real SQLite DB.

jest.mock('jsonwebtoken', () => ({ sign: jest.fn(), verify: jest.fn(), decode: jest.fn() }))
jest.mock('../../../config/config', () => ({
  jwt:  { secret: 's', expiresIn: '15m', refreshSecret: 'rs', refreshExpiresIn: '7d' },
  auth: { requireEmailVerification: false, emailVerificationExpiresHours: 24, passwordResetExpiresMinutes: 60 },
  clientUrl: 'http://app.test',
  line: { credentialEncryptionKey: '', channelId: 'CH123', liffId: 'LIFF123' },
}))
jest.mock('../../../models', () => ({
  User:               { scope: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn(), count: jest.fn(), update: jest.fn() },
  Role:               { findOne: jest.fn(), findAll: jest.fn(), findOrCreate: jest.fn() },
  Permission:         { findAll: jest.fn(), findOrCreate: jest.fn() },
  RefreshToken:       { create: jest.fn(), findOne: jest.fn(), update: jest.fn(), destroy: jest.fn() },
  MasterDataCategory: { findOrCreate: jest.fn() },
  MasterDataValue:    { findOrCreate: jest.fn() },
  Employee:           { findOne: jest.fn() },
  HrmsRole:           {},
  HrmsPermission:     {},
  Subscription:        { findOne: jest.fn() },
  Plan:                {},
  UsageCounter:        {},
  SubscriptionInvoice: {},
}))
jest.mock('../../../core/mailer', () => ({ sendEmailVerification: jest.fn(), sendPasswordReset: jest.fn() }))
// forLabel returns an object with the full logger surface (info/debug/error must exist
// for the real core/migrator used by the migration idempotency test). `warn` is shared
// so the upstream-failure test can assert the internal cause is logged.
jest.mock('../../../core/logger', () => {
  const warn = jest.fn()
  return { forLabel: () => ({ info: jest.fn(), warn, debug: jest.fn(), error: jest.fn() }) }
})

const express = require('express')
const http = require('http')
const { Sequelize, DataTypes } = require('sequelize')
const migrator = require('../../../core/migrator')
const jwt = require('jsonwebtoken')
const config = require('../../../config/config')
const { User, Role, RefreshToken } = require('../../../models')
const service = require('../auth.service')

// A user that satisfies both the auth checks and resolveSession's needs.
const makeUser = (over = {}) => ({
  id: 'u1', email: 'u@x.com', name: 'U', role: 'user', roles: [],
  organizationId: null, isActive: true, emailVerifiedAt: new Date(),
  provider: 'line', providerUid: 'U123',
  comparePassword: jest.fn().mockResolvedValue(true),
  update: jest.fn().mockResolvedValue(),
  setRoles: jest.fn().mockResolvedValue(),
  toJSON() { return { id: this.id, email: this.email, name: this.name, role: this.role } },
  ...over,
})

// A fake fetch that resolves a LINE ID-token verify response.
const okResponse = (claims) => ({ ok: true, json: async () => claims })
const failResponse = () => ({ ok: false, json: async () => ({}) })

const originalFetch = global.fetch

beforeEach(() => {
  jwt.sign.mockReturnValue('signed-token')
  jwt.decode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 })
  jwt.verify.mockReturnValue({ id: 'u1' })
  RefreshToken.create.mockResolvedValue()
  Role.findOne.mockResolvedValue(null) // no viewer role to assign
  config.line.channelId = 'CH123' // ensure configured unless a test overrides
  config.line.liffId = 'LIFF123'
})

afterEach(() => {
  global.fetch = originalFetch
})

describe('auth.lineLogin — LINE not configured', () => {
  test('501 when LINE_CHANNEL_ID is empty (feature-flag off)', async () => {
    config.line.channelId = ''
    await expect(service.lineLogin({ idToken: 'tok' }, {}))
      .rejects.toEqual({ status: 501, message: 'LINE login is not configured — set LINE_CHANNEL_ID on the server.' })
  })
})

describe('auth.lineLogin — verification guards', () => {
  test('400 when idToken is missing', async () => {
    global.fetch = jest.fn()
    await expect(service.lineLogin({}, {})).rejects.toEqual({ status: 400, message: 'LINE idToken is required' })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  test('401 when LINE rejects the ID token', async () => {
    global.fetch = jest.fn().mockResolvedValue(failResponse())
    await expect(service.lineLogin({ idToken: 'bad' }, {}))
      .rejects.toEqual({ status: 401, message: 'Invalid LINE ID token' })
  })

  test('401 when the token has no user subject', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse({ aud: 'CH123' })) // no sub
    await expect(service.lineLogin({ idToken: 'tok' }, {}))
      .rejects.toEqual({ status: 401, message: 'LINE ID token has no user subject' })
  })

  test('401 when the aud claim does not match the channel', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse({ sub: 'U123', aud: 'OTHER-CHANNEL' }))
    await expect(service.lineLogin({ idToken: 'tok' }, {}))
      .rejects.toEqual({ status: 401, message: 'LINE ID token audience does not match this channel' })
  })
})

describe('auth.lineLogin — upstream failure', () => {
  test('502 (generic) when the LINE verify call itself fails — no internal message leak', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed: ECONNRESET'))
    const warnSpy = require('../../../core/logger').forLabel('auth').warn
    warnSpy.mockClear()
    await expect(service.lineLogin({ idToken: 'tok' }, {}))
      .rejects.toEqual({ status: 502, message: 'LINE authentication is unavailable' })
    // The real cause must be logged, never surfaced to the caller.
    expect(warnSpy).toHaveBeenCalledWith('LINE ID token verify failed', { error: 'fetch failed: ECONNRESET' })
  })

  test('passes our own 400/401 guards through (verify throws { status })', async () => {
    // A 401 from verify (bad token) must not be turned into a 502 downstream.
    global.fetch = jest.fn().mockResolvedValue(failResponse())
    await expect(service.lineLogin({ idToken: 'bad' }, {}))
      .rejects.toEqual({ status: 401, message: 'Invalid LINE ID token' })
  })
})

describe('auth.lineLogin — find existing user', () => {
  test('maps an existing LINE uid to its platform User and issues tokens', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse({ sub: 'U123', name: 'Jim', picture: 'p' }))
    const user = makeUser()
    User.findOne.mockResolvedValue(user) // found by (provider=line, providerUid=U123)
    User.findByPk.mockResolvedValue(user) // resolveSession

    const out = await service.lineLogin({ idToken: 'tok' }, { userAgent: 'UA', ip: '1.1.1.1' })

    expect(User.findOne).toHaveBeenCalledWith({ where: { provider: 'line', providerUid: 'U123' } })
    expect(User.create).not.toHaveBeenCalled()
    expect(user.update).toHaveBeenCalledWith(expect.objectContaining({ lastLoginAt: expect.any(Date) }))
    expect(out.accessToken).toBe('signed-token')
    expect(out.refreshToken).toBe('signed-token')
    expect(out.user.id).toBe('u1')
    expect(RefreshToken.create).toHaveBeenCalled()
  })
})

describe('auth.lineLogin — auto-create a new user', () => {
  test('creates a role-user linked to the LINE uid and assigns the default role', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse({ sub: 'NEW123', name: 'New', picture: 'p' }))
    User.findOne.mockResolvedValue(null) // not linked yet (+ no email collision)
    const created = makeUser({ id: 'n1', providerUid: 'NEW123', name: 'New' })
    User.create.mockResolvedValue(created)
    User.findByPk.mockResolvedValue(created) // resolveSession

    const out = await service.lineLogin({ idToken: 'tok' }, {})

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
      role: 'user',
      provider: 'line',
      providerUid: 'NEW123',
      name: 'New',
      email: 'NEW123@line.local',
    }))
    // Default role assignment ran (Role.findOne was called for the viewer lookup).
    expect(Role.findOne).toHaveBeenCalledWith({ where: { slug: 'viewer' } })
    expect(out.accessToken).toBe('signed-token')
    expect(out.user.id).toBe('n1')
  })

  test('marks a freshly-created LINE user as email-verified (OAuth IdP)', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse({ sub: 'V123', name: 'Ver' }))
    User.findOne.mockResolvedValue(null)
    const created = makeUser({ id: 'v1', providerUid: 'V123', emailVerifiedAt: new Date() })
    User.create.mockResolvedValue(created)
    User.findByPk.mockResolvedValue(created)
    await service.lineLogin({ idToken: 'tok' }, {})
    // Even when requireEmailVerification is on, LINE users are verified at creation.
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ emailVerifiedAt: expect.any(Date) }))
  })

  test('falls back to "LINE User" when the profile carries no name', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse({ sub: 'NONAME', picture: 'p' })) // no name
    User.findOne.mockResolvedValue(null)
    const created = makeUser({ id: 'nn', providerUid: 'NONAME' })
    User.create.mockResolvedValue(created)
    User.findByPk.mockResolvedValue(created)

    const out = await service.lineLogin({ idToken: 'tok' }, {})

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'LINE User' }))
    expect(out.user.id).toBe('nn')
  })

  test('assignDefaultRole: calls setRoles with the viewer role when it exists', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse({ sub: 'VIEW1', name: 'V' }))
    User.findOne.mockResolvedValue(null)
    const created = makeUser({ id: 'v1', providerUid: 'VIEW1' })
    User.create.mockResolvedValue(created)
    User.findByPk.mockResolvedValue(created)
    Role.findOne.mockResolvedValue({ id: 'viewerId' }) // viewer role EXISTS

    await service.lineLogin({ idToken: 'tok' }, {})

    expect(created.setRoles).toHaveBeenCalledWith([{ id: 'viewerId' }])
  })

  test('401 when the linked account is inactive', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse({ sub: 'U123', name: 'Jim' }))
    User.findOne.mockResolvedValue(makeUser({ isActive: false }))
    await expect(service.lineLogin({ idToken: 'tok' }, {}))
      .rejects.toEqual({ status: 401, message: 'Account is inactive' })
  })
})

describe('auth.lineLogin — race-safe find-or-create', () => {
  test('recovers from a unique-violation race instead of throwing an unhandled 500', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse({ sub: 'RACE1', name: 'R' }))
    // Flow (new user, no email claim): provider lookup → miss; email-collision check →
    // miss; then User.create throws a unique constraint (a concurrent login won), so we
    // refetch the winner by (provider, providerUid).
    const winner = makeUser({ id: 'w1', providerUid: 'RACE1', name: 'R' })
    User.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(winner) // refetch after the race
    User.create.mockRejectedValue({
      name: 'SequelizeUniqueConstraintError',
      message: 'duplicate key value violates unique constraint "idx_users_provider_uid"',
    })
    User.findByPk.mockResolvedValue(winner) // resolveSession

    const out = await service.lineLogin({ idToken: 'tok' }, {})

    expect(User.create).toHaveBeenCalled() // it attempted the create
    expect(out.user.id).toBe('w1')
    expect(out.accessToken).toBe('signed-token')
  })

  test('links an existing local account by email instead of creating a duplicate', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse({ sub: 'LINK1', name: 'L', email: 'jane@corp.com' }))
    // Step 1 (provider lookup) → miss; step 2 (email match) → the local account.
    const local = makeUser({ id: 'local1', email: 'jane@corp.com', provider: null, providerUid: null })
    User.findOne
      .mockResolvedValueOnce(null)   // by (provider, providerUid)
      .mockResolvedValueOnce(local)  // by email
    User.findByPk.mockResolvedValue(local)

    const out = await service.lineLogin({ idToken: 'tok' }, {})

    // No new user created; the local account is linked in place.
    expect(User.create).not.toHaveBeenCalled()
    expect(local.update).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'line',
      providerUid: 'LINK1',
      emailVerifiedAt: expect.any(Date),
    }))
    expect(out.user.id).toBe('local1')
  })

  test('uses a random email suffix when the synthetic <uid>@line.local is already taken', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse({ sub: 'COLLIDE', name: 'C' }))
    // provider lookup → miss; email-collision check → a real user already owns
    // "COLLIDE@line.local", so we fall back to a random-suffixed synthetic email.
    User.findOne
      .mockResolvedValueOnce(null)      // provider (miss)
      .mockResolvedValueOnce({ id: 'real-user' }) // collision on the base email
    const created = makeUser({ id: 'c1', providerUid: 'COLLIDE' })
    User.create.mockResolvedValue(created)
    User.findByPk.mockResolvedValue(created)

    await service.lineLogin({ idToken: 'tok' }, {})

    const createCall = User.create.mock.calls[0][0]
    expect(createCall.email).toMatch(/^COLLIDE-[0-9a-f]{8}@line\.local$/)
    expect(createCall.email).not.toBe('COLLIDE@line.local')
  })
})

// ── Route level: POST /api/auth/line through the real router + controller ──────
describe('POST /api/auth/line (route → controller → service)', () => {
  let server

  const stopServer = () => new Promise((resolve) => server.close(resolve))

  const postJson = (path, body, headers = {}) => new Promise((resolve, reject) => {
    const data = JSON.stringify(body)
    const req = http.request({
      hostname: '127.0.0.1',
      port: server.address().port,
      path,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(data),
        ...headers,
      },
    }, (res) => {
      let chunks = ''
      res.on('data', (c) => { chunks += c })
      res.on('end', () => {
        let parsed = {}
        try { parsed = JSON.parse(chunks || '{}') } catch { /* keep empty */ }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed })
      })
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })

  beforeAll(async () => {
    const app = express()
    app.use(express.json())
    // Real auth router: rate-limit (memory store — no Redis in tests), lineRules,
    // validate, controller, and the real service against the mocked models.
    app.use('/api/auth', require('../auth.routes'))
    server = http.createServer(app)
    await new Promise((resolve) => server.listen(0, resolve))
  })

  afterAll(() => stopServer())

  test('200 — creates a new LINE user and sets the refresh cookie', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse({ sub: 'RT1', name: 'Route User' }))
    User.findOne.mockResolvedValue(null) // provider miss + no email collision
    const created = makeUser({ id: 'rt1', providerUid: 'RT1', name: 'Route User' })
    User.create.mockResolvedValue(created)
    User.findByPk.mockResolvedValue(created)
    Role.findOne.mockResolvedValue({ id: 'viewerId' })

    const res = await postJson('/api/auth/line', { idToken: 'tok' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.user.id).toBe('rt1')
    expect(res.body.data).not.toHaveProperty('refreshToken') // refresh stays in the cookie
    expect(created.setRoles).toHaveBeenCalledWith([{ id: 'viewerId' }])
    const setCookie = (res.headers['set-cookie'] || []).join(', ')
    expect(setCookie).toMatch(/refreshToken=/)
  })

  test('422 — validation rejects a missing idToken', async () => {
    const res = await postJson('/api/auth/line', {})
    expect(res.status).toBe(422)
    expect(res.body.success).toBe(false)
  })

  test('502 — upstream LINE failure surfaces as a clean generic message', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed'))
    const res = await postJson('/api/auth/line', { idToken: 'tok' })
    expect(res.status).toBe(502)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('LINE authentication is unavailable')
    expect(res.body.message).not.toMatch(/fetch failed/)
  })
})

// ── Migration: UNIQUE index + idempotency ─────────────────────────────────────
const LINE_MIGRATION = '20260902_000001_add_line_provider_to_users'

describe('LINE provider migration', () => {
  test('requests a UNIQUE (provider, providerUid) index', async () => {
    const mod = require(`../migrations/${LINE_MIGRATION}`)
    const ctx = {
      DataTypes,
      addColumn: jest.fn().mockResolvedValue(),
      addIndex: jest.fn().mockResolvedValue(),
    }
    await mod.up(ctx)
    expect(ctx.addIndex).toHaveBeenCalledWith(
      'Users',
      ['provider', 'providerUid'],
      { name: 'idx_users_provider_uid', unique: true },
    )
  })

  test('is idempotent — skips addColumn/addIndex when already present', async () => {
    const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false })
    const qi = sequelize.getQueryInterface()
    // Pre-create the Users table WITH the provider columns present, so addColumn
    // must skip them and only the index work remains (this is what a boot-time
    // sync() against an existing DB looks like).
    await qi.createTable('Users', {
      id: { type: DataTypes.UUID, primaryKey: true },
      provider: { type: DataTypes.STRING, allowNull: true },
      providerUid: { type: DataTypes.STRING, allowNull: true },
    })

    // First run: adds the index (columns already exist so addColumn is a no-op).
    const first = await migrator.up(sequelize, { only: LINE_MIGRATION })
    expect(first).toBe(1)
    const indexes = await qi.showIndex('Users')
    expect(indexes.some((i) => i.name === 'idx_users_provider_uid')).toBe(true)

    // Second run: already applied — the runner returns 0 (columns/index untouched).
    const second = await migrator.up(sequelize, { only: LINE_MIGRATION })
    expect(second).toBe(0)

    await sequelize.close()
  })
})
