// Unit tests for modules/auth.service.
//
// The crown-jewel module: token issuance, login/refresh rotation, email
// verification and password reset. jwt, config, models, mailer and the logger
// are all mocked so nothing is actually signed, mailed, or persisted. We focus
// on the guard branches (the security-relevant ones) plus a representative
// happy path through register/login/refresh that proves tokens are issued and
// sessions resolved. crypto runs for real — it's pure and deterministic enough.

jest.mock('jsonwebtoken', () => ({ sign: jest.fn(), verify: jest.fn(), decode: jest.fn() }))
jest.mock('../../../config/config', () => ({
  jwt:  { secret: 's', expiresIn: '15m', refreshSecret: 'rs', refreshExpiresIn: '7d' },
  auth: { requireEmailVerification: false, emailVerificationExpiresHours: 24, passwordResetExpiresMinutes: 60 },
  clientUrl: 'http://app.test',
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
  // Used by billing.service (required via auth.service's subscription gate).
  // findOne resolving undefined → no subscription row → not locked out.
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
const mailer = require('../../../core/mailer')
const service = require('../auth.service')

// Scoped lookups: User.scope('withPassword').findOne / .findByPk
const scopedFindOne  = jest.fn()
const scopedFindByPk = jest.fn()

const future = () => new Date(Date.now() + 60 * 60 * 1000)
const past   = () => new Date(Date.now() - 60 * 60 * 1000)

// A user that satisfies both the auth checks and resolveSession's needs.
// organizationId=null means the org IS this user, so resolveSession won't
// fire a second findByPk.
const makeUser = (over = {}) => ({
  id: 'u1', email: 'u@x.com', name: 'U', role: 'user', roles: [],
  organizationId: null, isActive: true, emailVerifiedAt: new Date(),
  comparePassword: jest.fn().mockResolvedValue(true),
  update: jest.fn().mockResolvedValue(),
  setRoles: jest.fn().mockResolvedValue(),
  toJSON() { return { id: this.id, email: this.email, name: this.name, role: this.role } },
  ...over,
})

beforeEach(() => {
  jwt.sign.mockReturnValue('signed-token')
  jwt.decode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 })
  jwt.verify.mockReturnValue({ id: 'u1' })
  mailer.sendEmailVerification.mockResolvedValue()
  mailer.sendPasswordReset.mockResolvedValue()
  RefreshToken.create.mockResolvedValue()
  User.scope.mockReturnValue({ findOne: scopedFindOne, findByPk: scopedFindByPk })
})

describe('auth.register', () => {
  test('rejects an already-registered email', async () => {
    User.findOne.mockResolvedValue({ id: 'existing' })
    await expect(service.register({ name: 'A', email: 'dup@x.com', password: 'p' }))
      .rejects.toEqual({ status: 409, message: 'Email already registered' })
  })

  test('creates the user, issues tokens and resolves a session', async () => {
    const user = makeUser()
    User.findOne.mockResolvedValue(null)
    User.create.mockResolvedValue(user)
    Role.findOne.mockResolvedValue(null) // no viewer role to assign
    User.findByPk.mockResolvedValue(user) // resolveSession
    const out = await service.register({ name: 'U', email: 'u@x.com', password: 'p' })
    expect(out.accessToken).toBe('signed-token')
    expect(out.refreshToken).toBe('signed-token')
    expect(out.permissions).toEqual([])
    expect(RefreshToken.create).toHaveBeenCalled()
  })
})

describe('auth.login', () => {
  test('401 when the account is unknown', async () => {
    scopedFindOne.mockResolvedValue(null)
    await expect(service.login({ email: 'x', password: 'p' })).rejects.toEqual({ status: 401, message: 'Invalid credentials' })
  })

  test('401 when the account is inactive', async () => {
    scopedFindOne.mockResolvedValue(makeUser({ isActive: false }))
    await expect(service.login({ email: 'x', password: 'p' })).rejects.toEqual({ status: 401, message: 'Invalid credentials' })
  })

  test('401 when the password does not match', async () => {
    scopedFindOne.mockResolvedValue(makeUser({ comparePassword: jest.fn().mockResolvedValue(false) }))
    await expect(service.login({ email: 'x', password: 'bad' })).rejects.toEqual({ status: 401, message: 'Invalid credentials' })
  })

  test('403 when email verification is required but missing', async () => {
    config.auth.requireEmailVerification = true
    scopedFindOne.mockResolvedValue(makeUser({ emailVerifiedAt: null }))
    try {
      await expect(service.login({ email: 'x', password: 'p' }))
        .rejects.toMatchObject({ status: 403 })
    } finally {
      config.auth.requireEmailVerification = false // restore
    }
  })

  test('issues tokens, stamps lastLoginAt and resolves a session on success', async () => {
    const user = makeUser()
    scopedFindOne.mockResolvedValue(user)
    User.findByPk.mockResolvedValue(user)
    const out = await service.login({ email: 'u@x.com', password: 'p' })
    expect(user.update).toHaveBeenCalledWith(expect.objectContaining({ lastLoginAt: expect.any(Date) }))
    expect(out.accessToken).toBe('signed-token')
    expect(out.user.id).toBe('u1')
  })
})

describe('auth.refresh', () => {
  test('401 when the token record is missing', async () => {
    RefreshToken.findOne.mockResolvedValue(null)
    await expect(service.refresh('tok')).rejects.toEqual({ status: 401, message: 'Invalid or expired refresh token' })
  })

  test('401 when the token record is expired', async () => {
    RefreshToken.findOne.mockResolvedValue({ expiresAt: past() })
    await expect(service.refresh('tok')).rejects.toEqual({ status: 401, message: 'Invalid or expired refresh token' })
  })

  test('rotates the token (revokes old, issues new) on success', async () => {
    const record = { expiresAt: future(), userAgent: 'UA', ip: '1.1.1.1', deviceLabel: 'D', update: jest.fn().mockResolvedValue() }
    RefreshToken.findOne.mockResolvedValue(record)
    User.findByPk.mockResolvedValue(makeUser())
    const out = await service.refresh('old-token')
    expect(record.update).toHaveBeenCalledWith(expect.objectContaining({ isRevoked: true }))
    expect(out).toEqual({ accessToken: 'signed-token', refreshToken: 'signed-token' })
  })

  test('401 when jwt verification of a stored token fails', async () => {
    RefreshToken.findOne.mockResolvedValue({ expiresAt: future(), update: jest.fn().mockResolvedValue() })
    jwt.verify.mockImplementation(() => { throw new Error('bad signature') })
    await expect(service.refresh('tok')).rejects.toEqual({ status: 401, message: 'Invalid refresh token' })
  })
})

describe('auth.logout', () => {
  test('revokes the supplied token', async () => {
    RefreshToken.update.mockResolvedValue([1])
    await service.logout('tok')
    expect(RefreshToken.update).toHaveBeenCalledWith({ isRevoked: true }, { where: { token: 'tok' } })
  })
})

describe('auth.changePassword', () => {
  test('400 when the current password is wrong', async () => {
    scopedFindByPk.mockResolvedValue(makeUser({ comparePassword: jest.fn().mockResolvedValue(false) }))
    await expect(service.changePassword('u1', { currentPassword: 'bad', newPassword: 'n' }))
      .rejects.toEqual({ status: 400, message: 'Current password is incorrect' })
  })

  test('updates the password when the current one matches', async () => {
    const user = makeUser()
    scopedFindByPk.mockResolvedValue(user)
    await service.changePassword('u1', { currentPassword: 'ok', newPassword: 'new' })
    expect(user.update).toHaveBeenCalledWith({ password: 'new' })
  })

  test('revokes every OTHER session but preserves the caller\'s current one', async () => {
    const { Op } = require('sequelize')
    const user = makeUser()
    scopedFindByPk.mockResolvedValue(user)
    RefreshToken.update.mockResolvedValue([2])
    await service.changePassword('u1', { currentPassword: 'ok', newPassword: 'new' }, 'CURRENT-TOKEN')
    const where = RefreshToken.update.mock.calls[0][1].where
    expect(where.userId).toBe('u1')
    expect(where.isRevoked).toBe(false)
    // The current session is explicitly excluded from revocation.
    expect(where.token[Op.ne]).toBe('CURRENT-TOKEN')
  })

  test('revokes ALL sessions when the caller does not identify its token', async () => {
    const user = makeUser()
    scopedFindByPk.mockResolvedValue(user)
    RefreshToken.update.mockResolvedValue([3])
    await service.changePassword('u1', { currentPassword: 'ok', newPassword: 'new' })
    expect(RefreshToken.update.mock.calls[0][1].where.token).toBeUndefined()
  })
})

describe('auth.login — enumeration resistance', () => {
  // An unknown email and a wrong password must be indistinguishable to the
  // caller: identical status + message, so response shape can't reveal whether
  // an email is registered. (The service also runs a dummy bcrypt compare for
  // unknown users to equalise timing.)
  test('unknown email and wrong password reject with the identical error', async () => {
    scopedFindOne.mockResolvedValue(null)
    const unknownErr = await service.login({ email: 'nobody@x.com', password: 'p' }).catch((e) => e)

    scopedFindOne.mockResolvedValue(makeUser({ comparePassword: jest.fn().mockResolvedValue(false) }))
    const wrongPwErr = await service.login({ email: 'real@x.com', password: 'bad' }).catch((e) => e)

    expect(unknownErr).toEqual({ status: 401, message: 'Invalid credentials' })
    expect(wrongPwErr).toEqual(unknownErr)
  })
})

describe('auth.getInstallStatus', () => {
  test('installed=false when there are no admins', async () => {
    User.count.mockResolvedValue(0)
    expect(await service.getInstallStatus()).toEqual({ installed: false })
  })

  test('installed=true once an admin exists', async () => {
    User.count.mockResolvedValue(1)
    expect(await service.getInstallStatus()).toEqual({ installed: true })
  })
})

describe('auth.install — guards', () => {
  test('403 when already installed', async () => {
    User.count.mockResolvedValue(1)
    await expect(service.install({ name: 'A', email: 'a@x.com', password: 'p' }))
      .rejects.toEqual({ status: 403, message: 'Application is already installed' })
  })

  test('409 when the email is taken', async () => {
    User.count.mockResolvedValue(0)
    User.findOne.mockResolvedValue({ id: 'existing' })
    await expect(service.install({ name: 'A', email: 'dup@x.com', password: 'p' }))
      .rejects.toEqual({ status: 409, message: 'Email already registered' })
  })
})

describe('auth.loginAs', () => {
  test('404 when the target is missing', async () => {
    User.findByPk.mockResolvedValue(null)
    await expect(service.loginAs('x')).rejects.toEqual({ status: 404, message: 'User not found' })
  })

  test('400 when the target is inactive', async () => {
    User.findByPk.mockResolvedValue(makeUser({ isActive: false }))
    await expect(service.loginAs('u1')).rejects.toEqual({ status: 400, message: 'Cannot impersonate an inactive user' })
  })

  test('403 when the target is an admin (no admin-to-admin impersonation)', async () => {
    User.findByPk.mockResolvedValue(makeUser({ role: 'admin' }))
    await expect(service.loginAs('u1')).rejects.toEqual({ status: 403, message: 'Cannot impersonate another administrator' })
  })

  test('issues a session for an active target', async () => {
    User.findByPk.mockResolvedValue(makeUser())
    const out = await service.loginAs('u1')
    expect(out.accessToken).toBe('signed-token')
  })
})

describe('auth.returnToAdmin', () => {
  // returnToAdmin rotates the parked impersonator token (via refresh) then
  // resolves the session it points at. Wire up the refresh happy path.
  const armRefresh = () => {
    RefreshToken.findOne.mockResolvedValue({
      expiresAt: future(), userAgent: null, ip: null, deviceLabel: null,
      update: jest.fn().mockResolvedValue(),
    })
  }

  test('403 when the parked token resolves to a non-admin session', async () => {
    armRefresh()
    User.findByPk.mockResolvedValue(makeUser({ role: 'user' }))
    await expect(service.returnToAdmin('parked-token')).rejects.toEqual({
      status: 403, message: 'Impersonation session is not an administrator',
    })
  })

  test('restores the admin session when the parked token is an admin', async () => {
    armRefresh()
    User.findByPk.mockResolvedValue(makeUser({ role: 'admin' }))
    const out = await service.returnToAdmin('parked-token')
    expect(out.user.role).toBe('admin')
    expect(out.accessToken).toBe('signed-token')
  })
})

describe('auth.verifyEmail', () => {
  test('400 when no token is supplied', async () => {
    await expect(service.verifyEmail('')).rejects.toEqual({ status: 400, message: 'Verification token is required' })
  })

  test('400 when the token matches nothing', async () => {
    User.findOne.mockResolvedValue(null)
    await expect(service.verifyEmail('raw')).rejects.toEqual({ status: 400, message: 'Invalid or expired verification link' })
  })

  test('400 when the token has expired', async () => {
    User.findOne.mockResolvedValue({ emailVerificationExpiresAt: past() })
    await expect(service.verifyEmail('raw')).rejects.toEqual({ status: 400, message: 'Invalid or expired verification link' })
  })

  test('marks the email verified and clears the token on success', async () => {
    const user = { email: 'e@x.com', emailVerificationExpiresAt: future(), update: jest.fn().mockResolvedValue() }
    User.findOne.mockResolvedValue(user)
    const out = await service.verifyEmail('raw')
    expect(out).toEqual({ email: 'e@x.com' })
    expect(user.update).toHaveBeenCalledWith(expect.objectContaining({ emailVerifiedAt: expect.any(Date), emailVerificationToken: null }))
  })
})

describe('auth.resendVerification', () => {
  test('silently returns for an unknown email (no enumeration leak)', async () => {
    User.findOne.mockResolvedValue(null)
    await expect(service.resendVerification('nobody@x.com')).resolves.toBeUndefined()
    expect(mailer.sendEmailVerification).not.toHaveBeenCalled()
  })

  test('silently returns when already verified', async () => {
    User.findOne.mockResolvedValue({ emailVerifiedAt: new Date() })
    await service.resendVerification('done@x.com')
    expect(mailer.sendEmailVerification).not.toHaveBeenCalled()
  })

  test('re-issues a verification email for an unverified user', async () => {
    User.findOne.mockResolvedValue({ email: 'e@x.com', name: 'E', emailVerifiedAt: null, update: jest.fn().mockResolvedValue() })
    await service.resendVerification('e@x.com')
    expect(mailer.sendEmailVerification).toHaveBeenCalledWith(expect.objectContaining({ to: 'e@x.com' }))
  })
})

describe('auth.forgotPassword', () => {
  test('silently returns for an unknown or inactive account', async () => {
    User.findOne.mockResolvedValue(null)
    await expect(service.forgotPassword('nobody@x.com')).resolves.toBeUndefined()
    expect(mailer.sendPasswordReset).not.toHaveBeenCalled()
  })

  test('mails a reset link for an active account', async () => {
    User.findOne.mockResolvedValue({ email: 'e@x.com', name: 'E', isActive: true, update: jest.fn().mockResolvedValue() })
    await service.forgotPassword('e@x.com')
    expect(mailer.sendPasswordReset).toHaveBeenCalledWith(expect.objectContaining({ to: 'e@x.com' }))
  })
})

describe('auth.resetPassword', () => {
  test('400 when no token is supplied', async () => {
    await expect(service.resetPassword({ newPassword: 'n' })).rejects.toEqual({ status: 400, message: 'Reset token is required' })
  })

  test('400 when the token matches nothing', async () => {
    scopedFindOne.mockResolvedValue(null)
    await expect(service.resetPassword({ token: 't', newPassword: 'n' })).rejects.toEqual({ status: 400, message: 'Invalid or expired reset link' })
  })

  test('400 when the token has expired', async () => {
    scopedFindOne.mockResolvedValue({ passwordResetExpiresAt: past() })
    await expect(service.resetPassword({ token: 't', newPassword: 'n' })).rejects.toEqual({ status: 400, message: 'Invalid or expired reset link' })
  })

  test('sets the new password and revokes all existing sessions', async () => {
    const user = { id: 'u1', passwordResetExpiresAt: future(), update: jest.fn().mockResolvedValue() }
    scopedFindOne.mockResolvedValue(user)
    RefreshToken.update.mockResolvedValue([2])
    await service.resetPassword({ token: 't', newPassword: 'new' })
    expect(user.update).toHaveBeenCalledWith(expect.objectContaining({ password: 'new', passwordResetToken: null }))
    expect(RefreshToken.update).toHaveBeenCalledWith({ isRevoked: true }, { where: { userId: 'u1', isRevoked: false } })
  })
})
