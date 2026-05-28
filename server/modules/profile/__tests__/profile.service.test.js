// Unit tests for modules/profile.service.
//
// updateProfile has the interesting logic: name is trimmed and only written
// when it actually changes; an email change is gated on uniqueness and resets
// verification + fires a fresh verification mail. Session helpers cover the
// RefreshToken listing/revocation rules (can't revoke the current session).

jest.mock('../../../config/config', () => ({
  clientUrl: 'http://app.test',
  auth: { emailVerificationExpiresHours: 24 },
}))
jest.mock('../../../models', () => ({
  User:         { findByPk: jest.fn(), findOne: jest.fn() },
  RefreshToken: { findAll: jest.fn(), findOne: jest.fn(), update: jest.fn() },
}))
jest.mock('../../../core/mailer', () => ({ sendEmailVerification: jest.fn() }))

const { Op } = require('sequelize')
const { User, RefreshToken } = require('../../../models')
const mailer = require('../../../core/mailer')
const service = require('../profile.service')

beforeEach(() => {
  mailer.sendEmailVerification.mockResolvedValue()
})

describe('profile.getProfile', () => {
  test('throws 404 when missing', async () => {
    User.findByPk.mockResolvedValue(null)
    await expect(service.getProfile('x')).rejects.toEqual({ status: 404, message: 'User not found' })
  })
})

describe('profile.updateProfile', () => {
  test('throws 404 when missing', async () => {
    User.findByPk.mockResolvedValue(null)
    await expect(service.updateProfile('x', { name: 'A' })).rejects.toEqual({ status: 404, message: 'User not found' })
  })

  test('no-op when nothing actually changes (no update, no verification)', async () => {
    const user = { name: 'Bob', email: 'bob@x.com', update: jest.fn() }
    User.findByPk.mockResolvedValue(user)
    const out = await service.updateProfile('u1', { name: 'Bob' }) // same name, no email
    expect(user.update).not.toHaveBeenCalled()
    expect(out.verificationSent).toBe(false)
  })

  test('trims and writes a changed name', async () => {
    const user = { name: 'Bob', email: 'bob@x.com', update: jest.fn().mockResolvedValue() }
    User.findByPk.mockResolvedValueOnce(user).mockResolvedValueOnce({ id: 'u1', name: 'Bobby' })
    await service.updateProfile('u1', { name: '  Bobby  ' })
    expect(user.update).toHaveBeenCalledWith({ name: 'Bobby' })
  })

  test('rejects an email already in use by another account', async () => {
    User.findByPk.mockResolvedValue({ name: 'Bob', email: 'bob@x.com', update: jest.fn() })
    User.findOne.mockResolvedValue({ id: 'other' })
    await expect(service.updateProfile('u1', { email: 'taken@x.com' }))
      .rejects.toEqual({ status: 409, message: 'Email already in use' })
    expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'taken@x.com', id: { [Op.ne]: 'u1' } } })
  })

  test('email change resets verification, mails a link, and reports verificationSent', async () => {
    const user = { name: 'Bob', email: 'bob@x.com', update: jest.fn().mockResolvedValue() }
    User.findByPk.mockResolvedValue(user)
    User.findOne.mockResolvedValue(null)
    const out = await service.updateProfile('u1', { email: 'new@x.com' })
    expect(out.verificationSent).toBe(true)
    const patch = user.update.mock.calls[0][0]
    expect(patch.email).toBe('new@x.com')
    expect(patch.emailVerifiedAt).toBeNull()
    expect(patch.emailVerificationToken).toEqual(expect.any(String))
    expect(mailer.sendEmailVerification).toHaveBeenCalledWith(expect.objectContaining({ to: 'bob@x.com' }))
  })
})

describe('profile.listSessions', () => {
  test('maps rows and flags the current session by token match', async () => {
    RefreshToken.findAll.mockResolvedValue([
      { id: 's1', deviceLabel: 'Chrome on Windows', userAgent: 'UA', ip: '1.1.1.1', createdAt: 'c', lastUsedAt: 'l', expiresAt: 'e', token: 'CURRENT' },
      { id: 's2', deviceLabel: null, token: 'OTHER' },
    ])
    const out = await service.listSessions('u1', 'CURRENT')
    expect(out[0]).toMatchObject({ id: 's1', deviceLabel: 'Chrome on Windows', isCurrent: true })
    expect(out[1]).toMatchObject({ id: 's2', deviceLabel: 'Unknown device', isCurrent: false })
    // only active, non-expired tokens are queried
    const where = RefreshToken.findAll.mock.calls[0][0].where
    expect(where.isRevoked).toBe(false)
    expect(where.expiresAt[Op.gt]).toBeInstanceOf(Date)
  })
})

describe('profile.revokeSession', () => {
  test('throws 404 when the session is not found', async () => {
    RefreshToken.findOne.mockResolvedValue(null)
    await expect(service.revokeSession('u1', 's1')).rejects.toEqual({ status: 404, message: 'Session not found' })
  })

  test('is a no-op when already revoked', async () => {
    const row = { isRevoked: true, update: jest.fn() }
    RefreshToken.findOne.mockResolvedValue(row)
    await service.revokeSession('u1', 's1')
    expect(row.update).not.toHaveBeenCalled()
  })

  test('refuses to revoke the current session', async () => {
    RefreshToken.findOne.mockResolvedValue({ isRevoked: false, token: 'CURRENT', update: jest.fn() })
    await expect(service.revokeSession('u1', 's1', 'CURRENT'))
      .rejects.toEqual({ status: 400, message: 'Cannot revoke the current session — use logout instead.' })
  })

  test('revokes another session', async () => {
    const row = { isRevoked: false, token: 'OTHER', update: jest.fn().mockResolvedValue() }
    RefreshToken.findOne.mockResolvedValue(row)
    await service.revokeSession('u1', 's1', 'CURRENT')
    expect(row.update).toHaveBeenCalledWith({ isRevoked: true })
  })
})

describe('profile.revokeAllOtherSessions', () => {
  test('excludes the current token and returns the revoked count', async () => {
    RefreshToken.update.mockResolvedValue([3])
    const out = await service.revokeAllOtherSessions('u1', 'CURRENT')
    expect(out).toEqual({ revoked: 3 })
    const where = RefreshToken.update.mock.calls[0][1].where
    expect(where.userId).toBe('u1')
    expect(where.token[Op.ne]).toBe('CURRENT')
  })

  test('revokes all when no current token is supplied', async () => {
    RefreshToken.update.mockResolvedValue([5])
    await service.revokeAllOtherSessions('u1')
    expect(RefreshToken.update.mock.calls[0][1].where.token).toBeUndefined()
  })
})
