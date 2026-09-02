// Unit tests for modules/auth.lineLogin (server-side LINE login).
//
// The LINE flow verifies an ID token server-side, then find-or-creates a platform
// User keyed by the LINE `sub` claim. jwt, config, models, mailer and the logger
// are mocked so nothing is actually signed, mailed, or persisted. Global `fetch`
// (the LINE OAuth verify call) is mocked so the OAuth round-trip never leaves the
// process. We focus on the guard branches (unconfigured channel, missing/malformed
// token, aud mismatch) plus a happy path for both the find-existing and
// create-new cases.

jest.mock('jsonwebtoken', () => ({ sign: jest.fn(), verify: jest.fn(), decode: jest.fn() }))
jest.mock('../../../config/config', () => ({
  jwt:  { secret: 's', expiresIn: '15m', refreshSecret: 'rs', refreshExpiresIn: '7d' },
  auth: { requireEmailVerification: false, emailVerificationExpiresHours: 24, passwordResetExpiresMinutes: 60 },
  clientUrl: 'http://app.test',
  line: { credentialEncryptionKey: '', channelId: 'CH123' },
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
jest.mock('../../../core/logger', () => ({ forLabel: () => ({ warn: jest.fn() }) }))

const jwt = require('jsonwebtoken')
const config = require('../../../config/config')
const { User, Role, RefreshToken } = require('../../../models')
const service = require('../auth.service')

const future = () => new Date(Date.now() + 60 * 60 * 1000)

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
    User.findOne.mockResolvedValue(null) // not linked yet
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

  test('401 when the linked account is inactive', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse({ sub: 'U123', name: 'Jim' }))
    User.findOne.mockResolvedValue(makeUser({ isActive: false }))
    await expect(service.lineLogin({ idToken: 'tok' }, {}))
      .rejects.toEqual({ status: 401, message: 'Account is inactive' })
  })
})
