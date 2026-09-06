const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const config = require('../../config/config')
const { User, Role, Permission, Module, RefreshToken, MasterDataCategory, MasterDataValue } = require('../../models')
const { Op } = require('sequelize')
const mailer = require('../../core/mailer')
const { employeePermissionSlugs } = require('../../../shared/hrms/services/access.service')
const billing = require('../billing/billing.service')

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
  // Verify (not just decode) so a tampered/forged token can never be persisted —
  // the refresh secret guarantees we only store tokens this server actually minted.
  const decoded = jwt.verify(token, config.jwt.refreshSecret)
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
  // Billing-only flag: an inactive subscription locks the tenant to the billing
  // pages (admins exempt). The client routes locked users to /billing.
  userJson.locked = user.role === 'admin' ? false : await billing.isOrgLocked(orgId)

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

  // Sign-in is allowed even with an inactive subscription — the resolved session
  // carries a `locked` flag and the client confines such users to billing.
  await user.update({ lastLoginAt: new Date() })

  const accessToken = signAccess(user)
  const refreshToken = signRefresh(user)
  await saveRefreshToken(user.id, refreshToken, meta)
  const session = await resolveSession(user.id)
  return { ...session, accessToken, refreshToken }
}

// ── LINE login ────────────────────────────────────────────────────────────────
//
// A LINE LIFF app hands us an ID token via POST /api/auth/line. We verify it
// server-side against LINE's OAuth endpoint (client_id = our channel id), then
// find-or-create a platform User keyed by the LINE `sub` claim. No password is
// involved — LINE is the identity provider, so we mint an opaque password for the
// row (the beforeCreate hook hashes it) purely to satisfy the NOT NULL column.

const LINE_PROVIDER = 'line'
const LINE_ID_TOKEN_VERIFY_URL = 'https://api.line.me/oauth2/v2.1/verify'

// A Sequelize unique-constraint error, raised by the UNIQUE (provider, providerUid)
// index when two concurrent logins race to create the same LINE user — or by the
// email unique index when a synthetic address collides with a real one.
const isUniqueViolation = (err) =>
  !!err && (
    err.name === 'SequelizeUniqueConstraintError' ||
    /duplicate key|unique constraint|already exists|SequelizeUniqueConstraintError/i.test(err.message || '')
  )

// Synthetic email for LINE-only identities, namespaced by the LINE `sub` so it can
// never collide with a real registered address. If a collision is ever found (e.g. a
// real user registered literally `<sub>@line.local`), we fall back to a random suffix.
const syntheticLineEmail = (uid) => `${uid}@line.local`
const syntheticLineEmailFallback = (uid) => `${uid}-${crypto.randomBytes(4).toString('hex')}@line.local`

// Pick the synthetic email, falling back to a random-suffixed one if `<sub>@line.local`
// is already taken by a real account. This is a best-effort guard — the real race
// safety for the same `sub` is the UNIQUE (provider, providerUid) index below.
const resolveLineEmail = async (uid) => {
  const base = syntheticLineEmail(uid)
  const collision = await User.findOne({ where: { email: base }, attributes: ['id'] })
  return collision ? syntheticLineEmailFallback(uid) : base
}

// Verify a LINE ID token and return the trusted profile claims. `channelId` is the
// OAuth client_id LINE expects; we also cross-check the `aud` claim as defence in
// depth (LINE sets `aud` to the channel id for channel-scoped tokens).
//
// NOTE: the ID token only carries `email` when the app was granted the (now
// deprecated) email scope — treat it as optional and normalise it to match the
// normalised addresses stored during registration, or account-linking won't match.
const verifyLineIdToken = async (idToken, channelId) => {
  const body = new URLSearchParams({ id_token: idToken, client_id: channelId })
  const response = await fetch(LINE_ID_TOKEN_VERIFY_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!response.ok) throw { status: 401, message: 'Invalid LINE ID token' }
  const claims = await response.json()
  if (!claims.sub) throw { status: 401, message: 'LINE ID token has no user subject' }
  if (claims.aud && claims.aud !== channelId) {
    throw { status: 401, message: 'LINE ID token audience does not match this channel' }
  }
  const email = typeof claims.email === 'string' ? claims.email.trim().toLowerCase() : null
  return { uid: claims.sub, name: claims.name || null, picture: claims.picture || null, email }
}

// Find-or-create the platform User for a verified LINE profile:
//   1) by the identity key (provider=line, providerUid=sub) — the normal path;
//   2) by the ID-token email, linking an existing local account instead of creating a
//      duplicate (no new row) — account linking;
//   3) create a fresh role-user when neither matched.
// Steps 2 and 3 are written to be race-safe: if a concurrent login wins first, the
// loser hits the UNIQUE (provider, providerUid) index, catches the constraint error,
// refetches the winner and carries on — never a 500 from an unhandled unique clash.
const findLineUserOrCreate = async (profile) => {
  // 1) Already linked to this LINE identity.
  let user = await User.findOne({ where: { provider: LINE_PROVIDER, providerUid: profile.uid } })
  if (user) return user

  // 2) Account linking by email. Skip when the ID token carried no email, or when the
  //    "email" is our own synthetic one for this uid.
  const linkEmail = profile.email && profile.email !== syntheticLineEmail(profile.uid)
  if (linkEmail) {
    const local = await User.findOne({ where: { email: linkEmail } })
    if (local && local.provider !== LINE_PROVIDER) {
      try {
        await local.update({
          provider: LINE_PROVIDER,
          providerUid: profile.uid,
          // LINE is an OAuth IdP — treat the identity as verified so LINE users are
          // never blocked by the requireEmailVerification gate (meant for sign-ups).
          emailVerifiedAt: local.emailVerifiedAt || new Date(),
        })
        return local
      } catch (err) {
        if (!isUniqueViolation(err)) throw err
        // Two different LINE accounts raced to link the same local account. Fall
        // through to the refetch/conflict handling in step 3.
        user = await User.findOne({ where: { provider: LINE_PROVIDER, providerUid: profile.uid } })
        if (user) return user
        throw { status: 409, message: 'This LINE account is already linked to another user' }
      }
    }
  }

  // 3) Create a fresh role-user linked to this LINE identity. The synthetic email is
  //    namespaced by uid (with a random-suffix fallback if it collides); the opaque
  //    password satisfies the NOT NULL column without allowing login.
  const email = await resolveLineEmail(profile.uid)
  try {
    user = await User.create({
      name: profile.name || 'LINE User',
      email,
      password: crypto.randomBytes(24).toString('hex'),
      role: 'user',
      provider: LINE_PROVIDER,
      providerUid: profile.uid,
      // LINE is an OAuth IdP — mark the (synthetic) email as verified immediately.
      emailVerifiedAt: new Date(),
    })
    await assignDefaultRole(user)
    return user
  } catch (err) {
    if (!isUniqueViolation(err)) throw err
    // Lost a concurrent find-or-create race (UNIQUE provider/uid clash): the winner
    // exists now — refetch and use it.
    user = await User.findOne({ where: { provider: LINE_PROVIDER, providerUid: profile.uid } })
    if (!user) throw { status: 500, message: 'Unable to link LINE account' }
    return user
  }
}

const lineLogin = async ({ idToken }, meta = {}) => {
  if (!idToken) throw { status: 400, message: 'LINE idToken is required' }
  // Feature-flag: LINE login can't work without a configured channel id.
  const channelId = config.line && config.line.channelId
  if (!channelId) throw { status: 501, message: 'LINE login is not configured — set LINE_CHANNEL_ID on the server.' }

  let profile
  try {
    profile = await verifyLineIdToken(idToken, channelId)
  } catch (err) {
    // Our own 400/401 guards (missing idToken, bad token, no sub, aud mismatch) pass
    // through intact. Anything else is an upstream/network failure — respond with a
    // clean generic 502 and log the real cause so it never reaches the client.
    if (err.status) throw err
    require('../../core/logger').forLabel('auth').warn('LINE ID token verify failed', { error: err.message })
    throw { status: 502, message: 'LINE authentication is unavailable' }
  }

  const user = await findLineUserOrCreate(profile)
  if (!user.isActive) throw { status: 401, message: 'Account is inactive' }

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
    // Refresh stays available in billing-only mode so a locked tenant keeps a
    // working session to re-subscribe; the access gate lives in the middleware.

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

// ── Defaults seeded on first install ─────────────────────────────────────────
// The install wizard must provision exactly the same permission catalog and
// default role grants as the module seeds used by DB_BOOTSTRAP deployments.
// A duplicated, drift-prone copy used to live here — it granted the viewer
// role `roles.list`/`permissions.list` and did not track the post-#11 viewer
// grant set (issue #16). Run the canonical seeds themselves instead.

const seedDefaults = async () => {
  const permissionsSeed = require('../permissions/seeds/permissions')
  const rolesSeed = require('../roles/seeds/roles')

  const store = {}
  const ctx = {
    models: { Permission, Role, Module },
    get: (key) => store[key],
    set: (key, value) => { store[key] = value },
  }
  await permissionsSeed.run(ctx)
  await rolesSeed.run(ctx)
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

// Restore the admin session from the parked impersonator refresh token: rotate
// it forward and resolve the admin's own session (the request is authenticated
// as the impersonated user, so the admin identity must come from the token).
const returnToAdmin = async (impersonatorToken, meta = {}) => {
  const tokens = await refresh(impersonatorToken, meta)
  // Verify the freshly-minted access token before trusting its id claim.
  const { id } = jwt.verify(tokens.accessToken, config.jwt.secret)
  const session = await resolveSession(id)
  // The parked token must belong to an admin — guards against a tampered or
  // mismatched impersonator cookie being used to resolve a non-admin session.
  if (session.user.role !== 'admin') throw { status: 403, message: 'Impersonation session is not an administrator' }
  return { ...session, ...tokens }
}

const loginAs = async (targetUserId, meta = {}) => {
  const target = await User.findByPk(targetUserId)
  if (!target) throw { status: 404, message: 'User not found' }
  if (!target.isActive) throw { status: 400, message: 'Cannot impersonate an inactive user' }
  // Never let one admin step into another admin's session — impersonation is
  // for supporting non-admin accounts, not for escalating between admins.
  if (target.role === 'admin') throw { status: 403, message: 'Cannot impersonate another administrator' }

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
  register, login, loginAs, returnToAdmin, refresh, logout, getMe, changePassword,
  pruneExpiredTokens, getInstallStatus, install,
  forgotPassword, resetPassword, verifyEmail, resendVerification,
  lineLogin,
}
