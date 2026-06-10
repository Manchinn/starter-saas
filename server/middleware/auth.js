const jwt = require('jsonwebtoken')
const config = require('../config/config')
const { User } = require('../models')
const billing = require('../modules/billing/billing.service')

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
    // Block tenants whose subscription is suspended/canceled/expired (admins exempt).
    try {
      await billing.assertOrgAccess(user)
    } catch (gateErr) {
      if (gateErr.status === 403 && gateErr.code) {
        return res.status(403).json({ success: false, code: gateErr.code, message: gateErr.message })
      }
      throw gateErr
    }
    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Access token expired', code: 'TOKEN_EXPIRED' })
    }
    return res.status(401).json({ success: false, message: 'Invalid access token' })
  }
}

module.exports = { authenticate }
