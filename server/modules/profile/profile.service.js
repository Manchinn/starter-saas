const crypto = require('crypto')
const { Op } = require('sequelize')
const config = require('../../config/config')
const { User, RefreshToken } = require('../../models')
const mailer = require('../../core/mailer')

const generateRawToken = () => crypto.randomBytes(32).toString('hex')
const hashToken        = (raw) => crypto.createHash('sha256').update(raw).digest('hex')

async function getProfile(userId) {
  const user = await User.findByPk(userId)
  if (!user) throw { status: 404, message: 'User not found' }
  return user
}

async function updateProfile(userId, { name, email }) {
  const user = await User.findByPk(userId)
  if (!user) throw { status: 404, message: 'User not found' }

  const updates = {}
  if (typeof name === 'string' && name.trim() && name.trim() !== user.name) {
    updates.name = name.trim()
  }

  let verificationSent = false
  if (typeof email === 'string' && email && email.toLowerCase() !== user.email.toLowerCase()) {
    const exists = await User.findOne({ where: { email, id: { [Op.ne]: userId } } })
    if (exists) throw { status: 409, message: 'Email already in use' }
    updates.email = email
    updates.emailVerifiedAt = null
    // Issue a fresh verification token for the new address
    const raw = generateRawToken()
    updates.emailVerificationToken = hashToken(raw)
    updates.emailVerificationExpiresAt = new Date(
      Date.now() + config.auth.emailVerificationExpiresHours * 60 * 60 * 1000
    )
    await user.update(updates)
    const verifyUrl = `${config.clientUrl}/verify-email/${raw}`
    await mailer.sendEmailVerification({
      to: user.email,
      name: user.name,
      verifyUrl,
      expiresHours: config.auth.emailVerificationExpiresHours,
    }).catch(() => {})
    verificationSent = true
    return { user: await User.findByPk(userId), verificationSent }
  }

  if (Object.keys(updates).length === 0) return { user, verificationSent: false }
  await user.update(updates)
  return { user: await User.findByPk(userId), verificationSent }
}

async function listSessions(userId, currentToken) {
  const rows = await RefreshToken.findAll({
    where: { userId, isRevoked: false, expiresAt: { [Op.gt]: new Date() } },
    order: [['lastUsedAt', 'DESC'], ['createdAt', 'DESC']],
  })
  return rows.map((r) => ({
    id:           r.id,
    deviceLabel:  r.deviceLabel || 'Unknown device',
    userAgent:    r.userAgent,
    ip:           r.ip,
    createdAt:    r.createdAt,
    lastUsedAt:   r.lastUsedAt,
    expiresAt:    r.expiresAt,
    isCurrent:    currentToken && r.token === currentToken,
  }))
}

async function revokeSession(userId, sessionId, currentToken) {
  const row = await RefreshToken.findOne({ where: { id: sessionId, userId } })
  if (!row) throw { status: 404, message: 'Session not found' }
  if (row.isRevoked) return
  if (currentToken && row.token === currentToken) {
    throw { status: 400, message: 'Cannot revoke the current session — use logout instead.' }
  }
  await row.update({ isRevoked: true })
}

async function revokeAllOtherSessions(userId, currentToken) {
  const where = { userId, isRevoked: false }
  if (currentToken) where.token = { [Op.ne]: currentToken }
  const [count] = await RefreshToken.update({ isRevoked: true }, { where })
  return { revoked: count }
}

module.exports = {
  getProfile,
  updateProfile,
  listSessions,
  revokeSession,
  revokeAllOtherSessions,
}
