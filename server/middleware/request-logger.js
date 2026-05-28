const logger = require('../core/logger').forLabel('http')

// Endpoints whose access is too noisy to log every hit
const SKIP_PATHS = new Set(['/api/health'])

const pickLevel = (status) => {
  if (status >= 500) return 'error'
  if (status >= 400) return 'warn'
  return 'info'
}

// Keep single-use tokens that travel in the URL path out of the logs.
const redactPath = (url = '') =>
  url
    .replace(/(\/verify-email\/)[^/?#]+/, '$1[redacted]')
    .replace(/(\/reset-password\/)[^/?#]+/, '$1[redacted]')

module.exports = function requestLogger(req, res, next) {
  if (SKIP_PATHS.has(req.path)) return next()

  const start = process.hrtime.bigint()

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6
    const level = pickLevel(res.statusCode)
    const safePath = redactPath(req.originalUrl || req.url)
    logger.log(level, `${req.method} ${safePath} → ${res.statusCode} (${durationMs.toFixed(1)}ms)`, {
      method:   req.method,
      path:     safePath,
      status:   res.statusCode,
      duration: Math.round(durationMs),
      ip:       req.ip,
      userId:   req.user?.id || null,
    })
  })

  next()
}
