const logger = require('../core/logger').forLabel('http')

// Endpoints whose access is too noisy to log every hit
const SKIP_PATHS = new Set(['/api/health'])

const pickLevel = (status) => {
  if (status >= 500) return 'error'
  if (status >= 400) return 'warn'
  return 'info'
}

module.exports = function requestLogger(req, res, next) {
  if (SKIP_PATHS.has(req.path)) return next()

  const start = process.hrtime.bigint()

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6
    const level = pickLevel(res.statusCode)
    logger.log(level, `${req.method} ${req.originalUrl || req.url} → ${res.statusCode} (${durationMs.toFixed(1)}ms)`, {
      method:   req.method,
      path:     req.originalUrl || req.url,
      status:   res.statusCode,
      duration: Math.round(durationMs),
      ip:       req.ip,
      userId:   req.user?.id || null,
    })
  })

  next()
}
