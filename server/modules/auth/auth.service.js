const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const config = require('../../config/config')
const { User, Role, Permission, RefreshToken, MasterDataCategory, MasterDataValue } = require('../../models')
const { Op } = require('sequelize')
const mailer = require('../../core/mailer')
const { employeePermissionSlugs } = require('../../../shared/hrms/services/access.service')

// ── Token generation (random, opaque, URL-safe) ──────────────────────────────
const generateRawToken = () => crypto.randomBytes(32).toString('hex')
const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex')

// A valid bcrypt hash used to equalise login timing when the account doesn't
// exist, so response time can't be used to enumerate registered emails.
const DUMMY_HASH = bcrypt.hashSync('timing-equalisation-placeholder', 12)

// ── Token helpers ────────────────────────────────────────────────────────────

const signAccess = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  })

const signRefresh = (user) =>
  jwt.sign({ id: user.id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  })

const truncate = (s, n) => (typeof s === 'string' && s.length > n ? s.slice(0, n) : s)

const deviceLabelFromUA = (ua = '') => {
  if (!ua) return 'Unknown device'
  const lower = ua.toLowerCase()
  const browser =
    lower.includes('edg/')      ? 'Edge'    :
    lower.includes('chrome/')   ? 'Chrome'  :
    lower.includes('firefox/')  ? 'Firefox' :
    lower.includes('safari/')   ? 'Safari'  :
    lower.includes('opera/') || lower.includes('opr/') ? 'Opera' :
    'Browser'
  const os =
    lower.includes('windows')   ? 'Windows' :
    lower.includes('mac os')    ? 'macOS'   :
    lower.includes('android')   ? 'Android' :
    lower.includes('iphone') || lower.includes('ipad') ? 'iOS' :
    lower.includes('linux')     ? 'Linux'   :
    'Unknown OS'
  return `${browser} on ${os}`
}

const saveRefreshToken = async (userId, token, meta = {}) => {
  const decoded = jwt.decode(token)
  const userAgent   = truncate(meta.userAgent || null, 500)
  const ip          = truncate(meta.ip        || null, 60)
  const deviceLabel = truncate(meta.deviceLabel || deviceLabelFromUA(meta.userAgent || ''), 120)
  await RefreshToken.create({
    userId,
    token,
    expiresAt: new Date(decoded.exp * 1000),
    userAgent,
    ip,
    deviceLabel,
    lastUsedAt: new Date(),
  })
}

// ── Session resolution ───────────────────────────────────────────────────────

/**
 * Returns the full user profile: user data + roles + resolved permissions.
 * System admins get permissions: ['*'].
 */
const resolveSession = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [{
      model: Role, as: 'roles',
      attributes: ['id', 'slug', 'name', 'color'],
      include: [{ model: Permission, as: 'permissions', attributes: ['id', 'slug', 'name', 'group'] }],
    }],
  })
  if (!user) throw { status: 404, message: 'User not found' }

  let permissions
  if (user.role === 'admin') {
    permissions = ['*']
  } else {
    const slugSet = new Set()
    for (const role of user.roles) {
      for (const perm of role.permissions) slugSet.add(perm.slug)
    }
    // Fold in grants from HRMS roles attached to the user's Employee record.
    for (const slug of await employeePermissionSlugs(user.id)) slugSet.add(slug)
    permissions = [...slugSet]
  }

  // The user's "organization" is the top-level user record (the one with
  // organizationId=null). For staff members organizationId already points
  // there; for an org admin the user *is* the org. Surface its profile so the
  // client can render company info on documents without an extra fetch.
  const ORG_ATTRS = ['id', 'name', 'companyName', 'address', 'phone', 'email', 'taxId', 'website', 'logoPath']
  const orgId = user.organizationId || user.id
  const organization = orgId === user.id
    ? pickOrgAttrs(user, ORG_ATTRS)
    : pickOrgAttrs(await User.findByPk(orgId, { attributes: ORG_ATTRS }), ORG_ATTRS)

  const userJson = user.toJSON()
  userJson.organization = organization

  return { user: userJson, permissions }
}

function pickOrgAttrs(row, attrs) {
  if (!row) return null
  const json = typeof row.toJSON === 'function' ? row.toJSON() : row
  return Object.fromEntries(attrs.map(k => [k, json[k] ?? null]))
}

// ── Default role helper ──────────────────────────────────────────────────────

const assignDefaultRole = async (user) => {
  const viewer = await Role.findOne({ where: { slug: 'viewer' } })
  if (viewer) await user.setRoles([viewer])
}

// ── Auth operations ──────────────────────────────────────────────────────────

const register = async ({ name, email, password }, meta = {}) => {
  const exists = await User.findOne({ where: { email } })
  if (exists) throw { status: 409, message: 'Email already registered' }

  const user = await User.create({ name, email, password })
  await assignDefaultRole(user)
  await issueEmailVerification(user).catch((err) => {
    // Don't block registration on email failure; the user can resend later.
    require('../../core/logger').forLabel('auth').warn('Verification email failed at register', { error: err.message })
  })

  const accessToken = signAccess(user)
  const refreshToken = signRefresh(user)
  await saveRefreshToken(user.id, refreshToken, meta)
  const session = await resolveSession(user.id)
  return { ...session, accessToken, refreshToken }
}

const login = async ({ email, password }, meta = {}) => {
  const user = await User.scope('withPassword').findOne({ where: { email } })
  // Always run one bcrypt comparison (against a dummy hash when the user is
  // missing) so timing doesn't reveal whether the email is registered.
  const valid = user
    ? await user.comparePassword(password)
    : await bcrypt.compare(password, DUMMY_HASH)
  if (!user || !user.isActive || !valid) throw { status: 401, message: 'Invalid credentials' }

  if (config.auth.requireEmailVerification && !user.emailVerifiedAt) {
    throw { status: 403, message: 'Please verify your email address before signing in.' }
  }

  await user.update({ lastLoginAt: new Date() })

  const accessToken = signAccess(user)
  const refreshToken = signRefresh(user)
  await saveRefreshToken(user.id, refreshToken, meta)
  const session = await resolveSession(user.id)
  return { ...session, accessToken, refreshToken }
}

const refresh = async (token, meta = {}) => {
  const record = await RefreshToken.findOne({ where: { token, isRevoked: false } })
  if (!record || record.expiresAt < new Date()) {
    throw { status: 401, message: 'Invalid or expired refresh token' }
  }

  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret)
    const user = await User.findByPk(decoded.id)
    if (!user || !user.isActive) throw { status: 401, message: 'User not found' }

    // Rotate — carry forward device info if the new request didn't bring fresh meta
    await record.update({ isRevoked: true, lastUsedAt: new Date() })
    const carryMeta = {
      userAgent:   meta.userAgent   || record.userAgent,
      ip:          meta.ip          || record.ip,
      deviceLabel: meta.deviceLabel || record.deviceLabel,
    }
    const accessToken = signAccess(user)
    const newRefreshToken = signRefresh(user)
    await saveRefreshToken(user.id, newRefreshToken, carryMeta)
    return { accessToken, refreshToken: newRefreshToken }
  } catch (err) {
    if (err.status) throw err
    throw { status: 401, message: 'Invalid refresh token' }
  }
}

const logout = async (token) => {
  await RefreshToken.update({ isRevoked: true }, { where: { token } })
}

const getMe = async (userId) => resolveSession(userId)

const changePassword = async (userId, { currentPassword, newPassword }, currentRefreshToken = null) => {
  const user = await User.scope('withPassword').findByPk(userId)
  const valid = await user.comparePassword(currentPassword)
  if (!valid) throw { status: 400, message: 'Current password is incorrect' }
  await user.update({ password: newPassword })
  // Revoke other sessions so a changed password kicks out any other device
  // (e.g. a suspected-compromised one). Keep the caller's current session alive
  // when it identifies itself via its refresh token.
  const where = { userId, isRevoked: false }
  if (currentRefreshToken) where.token = { [Op.ne]: currentRefreshToken }
  await RefreshToken.update({ isRevoked: true }, { where })
}

const getInstallStatus = async () => {
  const adminCount = await User.count({ where: { role: 'admin' } })
  return { installed: adminCount > 0 }
}

// ── Default permissions & roles seeded on first install ──────────────────────

const DEFAULT_PERMISSIONS = [
  { slug: 'dashboard.view',       name: 'View Dashboard',       group: 'dashboard',   description: 'Access the main dashboard' },
  { slug: 'users.list',           name: 'List Users',           group: 'users',       description: 'View the users list' },
  { slug: 'users.edit',           name: 'Edit Users',           group: 'users',       description: 'Create and edit users' },
  { slug: 'users.delete',         name: 'Delete Users',         group: 'users',       description: 'Delete user accounts' },
  { slug: 'roles.list',           name: 'List Roles',           group: 'roles',       description: 'View available roles' },
  { slug: 'roles.manage',         name: 'Manage Roles',         group: 'roles',       description: 'Create, edit and delete roles' },
  { slug: 'permissions.list',     name: 'List Permissions',     group: 'permissions', description: 'View defined permissions' },
  { slug: 'permissions.manage',   name: 'Manage Permissions',   group: 'permissions', description: 'Create, edit and delete permissions' },
  { slug: 'modules.list',         name: 'List Modules',         group: 'modules',     description: 'View installed modules' },
  { slug: 'modules.manage',       name: 'Manage Modules',       group: 'modules',     description: 'Enable and disable modules' },
]

const DEFAULT_ROLES = [
  {
    slug: 'viewer', name: 'Viewer', color: '#059669', isSystem: true,
    description: 'Read-only access across the application',
    permissions: ['dashboard.view', 'users.list', 'roles.list', 'permissions.list', 'modules.list'],
  },
  {
    slug: 'manager', name: 'Manager', color: '#2563eb', isSystem: true,
    description: 'Full user and configuration management',
    permissions: ['dashboard.view', 'users.list', 'users.edit', 'users.delete', 'roles.list', 'roles.manage', 'permissions.list', 'permissions.manage', 'modules.list', 'modules.manage'],
  },
  {
    slug: 'super-admin', name: 'Super Admin', color: '#7c3aed', isSystem: true,
    description: 'Unrestricted access to everything',
    permissions: null, // assigned all permissions below
  },
]

const seedDefaults = async () => {
  for (const p of DEFAULT_PERMISSIONS) {
    await Permission.findOrCreate({ where: { slug: p.slug }, defaults: p })
  }

  const allPerms = await Permission.findAll()
  const bySlug = Object.fromEntries(allPerms.map((p) => [p.slug, p]))

  for (const r of DEFAULT_ROLES) {
    const [role] = await Role.findOrCreate({
      where: { slug: r.slug },
      defaults: { name: r.name, slug: r.slug, description: r.description, color: r.color, isSystem: r.isSystem },
    })
    const perms = r.permissions ? r.permissions.map((s) => bySlug[s]).filter(Boolean) : allPerms
    await role.setPermissions(perms)
  }
}

// ── Master Data seeded on first install ──────────────────────────────────────

const MASTER_DATA_SEED = [
  {
    slug: 'payment-methods', name: 'Payment Methods',
    description: 'Available payment methods for receipts',
    isSystem: true,
    values: [
      { code: 'cash',          name: 'Cash',          sortOrder: 10 },
      { code: 'credit_card',   name: 'Credit Card',   sortOrder: 20 },
      { code: 'bank_transfer', name: 'Bank Transfer',  sortOrder: 30 },
      { code: 'check',         name: 'Check',         sortOrder: 40 },
    ],
  },
  {
    slug: 'adjustment-reasons', name: 'Stock Adjustment Reasons',
    description: 'Reasons for stock adjustments',
    isSystem: true,
    values: [
      { code: 'damaged',     name: 'Damaged',          sortOrder: 10 },
      { code: 'expired',     name: 'Expired',          sortOrder: 20 },
      { code: 'miscounted',  name: 'Miscounted',       sortOrder: 30 },
      { code: 'returned',    name: 'Returned',         sortOrder: 40 },
      { code: 'other',       name: 'Other',            sortOrder: 50 },
    ],
  },
  {
    slug: 'issue-reasons', name: 'Stock Issue Reasons',
    description: 'Reasons for issuing stock out of warehouse',
    isSystem: true,
    values: [
      { code: 'internal_use', name: 'Internal Use',   sortOrder: 10 },
      { code: 'transfer',     name: 'Transfer',       sortOrder: 20 },
      { code: 'damaged',      name: 'Damaged',        sortOrder: 30 },
      { code: 'expired',      name: 'Expired',        sortOrder: 40 },
      { code: 'other',        name: 'Other',          sortOrder: 50 },
    ],
  },
  {
    slug: 'return-reasons', name: 'Stock Return Reasons',
    description: 'Reasons for returning stock',
    isSystem: true,
    values: [
      { code: 'wrong_item',  name: 'Wrong Item',      sortOrder: 10 },
      { code: 'damaged',     name: 'Damaged',         sortOrder: 20 },
      { code: 'expired',     name: 'Expired',         sortOrder: 30 },
      { code: 'excess',      name: 'Excess Stock',    sortOrder: 40 },
      { code: 'other',       name: 'Other',           sortOrder: 50 },
    ],
  },
  {
    slug: 'vendor-statuses', name: 'Vendor Statuses',
    description: 'Status options for vendors',
    isSystem: true,
    values: [
      { code: 'active',   name: 'Active',   sortOrder: 10 },
      { code: 'inactive', name: 'Inactive', sortOrder: 20 },
    ],
  },
  {
    slug: 'employee-statuses', name: 'Employee Statuses',
    description: 'Employment status options',
    isSystem: true,
    values: [
      { code: 'active',     name: 'Active',     sortOrder: 10 },
      { code: 'inactive',   name: 'Inactive',   sortOrder: 20 },
      { code: 'terminated', name: 'Terminated', sortOrder: 30 },
    ],
  },
  {
    slug: 'product-statuses', name: 'Product Statuses',
    description: 'Status options for products',
    isSystem: true,
    values: [
      { code: 'active',   name: 'Active',   sortOrder: 10 },
      { code: 'inactive', name: 'Inactive', sortOrder: 20 },
    ],
  },
  {
    slug: 'product-category-statuses', name: 'Product Category Statuses',
    description: 'Status options for product categories',
    isSystem: true,
    values: [
      { code: 'active',   name: 'Active',   sortOrder: 10 },
      { code: 'inactive', name: 'Inactive', sortOrder: 20 },
    ],
  },
  {
    slug: 'pricing-statuses', name: 'Pricing Statuses',
    description: 'Status options for price lists',
    isSystem: true,
    values: [
      { code: 'active',   name: 'Active',   sortOrder: 10 },
      { code: 'inactive', name: 'Inactive', sortOrder: 20 },
    ],
  },
  {
    slug: 'sale-item-statuses', name: 'Sale Item Statuses',
    description: 'Status options for sale items',
    isSystem: true,
    values: [
      { code: 'active',   name: 'Active',   sortOrder: 10 },
      { code: 'inactive', name: 'Inactive', sortOrder: 20 },
    ],
  },
]

const seedMasterData = async () => {
  for (const cat of MASTER_DATA_SEED) {
    const { values, ...catData } = cat
    const [category] = await MasterDataCategory.findOrCreate({
      where: { slug: catData.slug },
      defaults: catData,
    })
    for (const v of values) {
      await MasterDataValue.findOrCreate({
        where: { categoryId: category.id, code: v.code },
        defaults: { ...v, categoryId: category.id, isActive: true },
      })
    }
  }
}

const install = async ({ name, email, password }, meta = {}) => {
  const adminCount = await User.count({ where: { role: 'admin' } })
  if (adminCount > 0) throw { status: 403, message: 'Application is already installed' }

  const exists = await User.findOne({ where: { email } })
  if (exists) throw { status: 409, message: 'Email already registered' }

  await seedDefaults()
  await seedMasterData()

  const user = await User.create({ name, email, password, role: 'admin' })
  const superAdmin = await Role.findOne({ where: { slug: 'super-admin' } })
  if (superAdmin) await user.setRoles([superAdmin])
  await issueEmailVerification(user).catch((err) => {
    require('../../core/logger').forLabel('auth').warn('Verification email failed at install', { error: err.message })
  })

  const accessToken = signAccess(user)
  const refreshToken = signRefresh(user)
  await saveRefreshToken(user.id, refreshToken, meta)
  const session = await resolveSession(user.id)
  return { ...session, accessToken, refreshToken }
}

const loginAs = async (targetUserId, meta = {}) => {
  const target = await User.findByPk(targetUserId)
  if (!target) throw { status: 404, message: 'User not found' }
  if (!target.isActive) throw { status: 400, message: 'Cannot impersonate an inactive user' }

  const accessToken  = signAccess(target)
  const refreshToken = signRefresh(target)
  await saveRefreshToken(target.id, refreshToken, meta)
  const session = await resolveSession(target.id)
  return { ...session, accessToken, refreshToken }
}

const pruneExpiredTokens = () =>
  RefreshToken.destroy({ where: { expiresAt: { [Op.lt]: new Date() } } })

// ── Email verification ───────────────────────────────────────────────────────

async function issueEmailVerification(user) {
  const raw = generateRawToken()
  const hash = hashToken(raw)
  const expiresAt = new Date(Date.now() + config.auth.emailVerificationExpiresHours * 60 * 60 * 1000)
  await user.update({ emailVerificationToken: hash, emailVerificationExpiresAt: expiresAt })
  const verifyUrl = `${config.clientUrl}/verify-email/${raw}`
  await mailer.sendEmailVerification({
    to: user.email,
    name: user.name,
    verifyUrl,
    expiresHours: config.auth.emailVerificationExpiresHours,
  })
}

const resendVerification = async (email) => {
  // Always return success-shaped result to avoid leaking which emails exist.
  const user = await User.findOne({ where: { email } })
  if (!user || user.emailVerifiedAt) return
  await issueEmailVerification(user)
}

const verifyEmail = async (rawToken) => {
  if (!rawToken) throw { status: 400, message: 'Verification token is required' }
  const hash = hashToken(rawToken)
  const user = await User.findOne({ where: { emailVerificationToken: hash } })
  if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
    throw { status: 400, message: 'Invalid or expired verification link' }
  }
  await user.update({
    emailVerifiedAt: new Date(),
    emailVerificationToken: null,
    emailVerificationExpiresAt: null,
  })
  return { email: user.email }
}

// ── Password reset ───────────────────────────────────────────────────────────

const forgotPassword = async (email) => {
  // Always return success-shaped result regardless of whether the email exists.
  const user = await User.findOne({ where: { email } })
  if (!user || !user.isActive) return

  const raw = generateRawToken()
  const hash = hashToken(raw)
  const expiresAt = new Date(Date.now() + config.auth.passwordResetExpiresMinutes * 60 * 1000)
  await user.update({ passwordResetToken: hash, passwordResetExpiresAt: expiresAt })
  const resetUrl = `${config.clientUrl}/reset-password/${raw}`
  await mailer.sendPasswordReset({
    to: user.email,
    name: user.name,
    resetUrl,
    expiresMinutes: config.auth.passwordResetExpiresMinutes,
  })
}

const resetPassword = async ({ token, newPassword }) => {
  if (!token) throw { status: 400, message: 'Reset token is required' }
  const hash = hashToken(token)
  const user = await User.scope('withPassword').findOne({ where: { passwordResetToken: hash } })
  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
    throw { status: 400, message: 'Invalid or expired reset link' }
  }
  await user.update({
    password: newPassword,
    passwordResetToken: null,
    passwordResetExpiresAt: null,
  })
  // Revoke all refresh tokens so existing sessions can't keep going.
  await RefreshToken.update({ isRevoked: true }, { where: { userId: user.id, isRevoked: false } })
}

module.exports = {
  register, login, loginAs, refresh, logout, getMe, changePassword,
  pruneExpiredTokens, getInstallStatus, install,
  forgotPassword, resetPassword, verifyEmail, resendVerification,
}
