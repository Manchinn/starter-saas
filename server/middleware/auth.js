const jwt = require('jsonwebtoken')
const config = require('../config/config')
const { User } = require('../models')
const billing = require('../modules/billing/billing.service')

// Billing-only mode: a locked-out tenant (inactive subscription) may still reach
// the billing pages to re-subscribe and the auth endpoints (so they can load
// their session and sign out) — everything else is blocked with a 403 the
// client turns into a redirect to /billing.
const BILLING_ONLY_ALLOW = [/^\/api\/billing(?:\/|$)/, /^\/api\/auth(?:\/|$)/]
const isBillingOnlyPath = (req) => {
  const path = (req.originalUrl || req.path || '').split('?')[0]
  return BILLING_ONLY_ALLOW.some((re) => re.test(path))
}

/**
 * Verify JWT access token and attach user to req.user.
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access token required' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, config.jwt.secret)
    const user = await User.findByPk(decoded.id)
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid or inactive account' })
    }
    req.user = user

    // Tenants with an inactive subscription (suspended/canceled/expired) are put
    // in billing-only mode: blocked everywhere except billing + auth (admins exempt).
    req.orgLocked = await billing.isUserLocked(user)
    if (req.orgLocked && !isBillingOnlyPath(req)) {
      return res.status(403).json({
        success: false,
        code: 'SUBSCRIPTION_INACTIVE',
        message: 'This account’s subscription is inactive. Choose a plan to restore access.',
      })
    }
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Access token expired', code: 'TOKEN_EXPIRED' })
    }
    return res.status(401).json({ success: false, message: 'Invalid access token' })
  }
}

module.exports = { authenticate }
