const jwt = require('jsonwebtoken')
const config = require('../config/config')
const { User } = require('../models')
const billing = require('../modules/billing/billing.service')

// Billing-only mode: locked tenants (inactive subscription) may still hit billing
// pages to re-subscribe and auth endpoints to load/refresh/logout. Everything else
// returns 403 SUBSCRIPTION_INACTIVE for the client to redirect to /billing.
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

    // Tenants with an inactive subscription enter billing-only mode (admins exempt).
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
