const billing = require('../modules/billing/billing.service')

const limitLocks = new Map()

const organizationIdOf = (req) => req?.user?.organizationId || req?.user?.id || null

const requireFeature = (feature) => async (req, res, next) => {
  try {
    if (req.user?.role === 'admin') return next()
    const organizationId = organizationIdOf(req)
    if (!organizationId) return res.status(401).json({ success: false, message: 'Unauthorized' })
    if (await billing.hasFeature(organizationId, feature)) return next()
    return res.status(403).json({ success: false, code: 'FEATURE_NOT_IN_PLAN', message: 'Your plan does not include this feature.' })
  } catch {
    return res.status(500).json({ success: false, message: 'Plan check failed' })
  }
}

const enforceLimit = (metric, { amount = 1 } = {}) => async (req, res, next) => {
  let release = null
  try {
    const organizationId = organizationIdOf(req)
    if (!organizationId) return res.status(401).json({ success: false, message: 'Unauthorized' })
    release = await acquireLimitLock(`${organizationId}:${metric}`)
    const quota = await billing.checkLimit(organizationId, metric, amount)
    if (quota.allowed) {
      res.on('finish', release)
      res.on('close', release)
      return next()
    }
    release()
    release = null
    return res.status(403).json({
      success: false,
      code: 'LIMIT_REACHED',
      message: `Plan limit reached (${quota.used}/${quota.limit}).`,
      metric,
      limit: quota.limit,
      used: quota.used,
    })
  } catch {
    release?.()
    return res.status(500).json({ success: false, message: 'Plan check failed' })
  }
}

function acquireLimitLock(key) {
  const previous = limitLocks.get(key) || Promise.resolve()
  let releaseCurrent
  const current = new Promise((resolve) => { releaseCurrent = resolve })
  const queue = previous.then(() => current)
  limitLocks.set(key, queue)
  return previous.then(() => {
    let released = false
    return () => {
      if (released) return
      released = true
      releaseCurrent()
      if (limitLocks.get(key) === queue) limitLocks.delete(key)
    }
  })
}

const meter = (metric, { amount = 1 } = {}) => (req, res, next) => {
  const organizationId = organizationIdOf(req)
  res.on('finish', () => {
    if (!organizationId || res.statusCode >= 400) return
    Promise.resolve(billing.increment(organizationId, metric, amount)).catch(() => {})
  })
  next()
}

module.exports = { organizationIdOf, requireFeature, enforceLimit, meter }
