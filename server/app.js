require('dotenv').config()
const path = require('path')
const fs = require('fs')
const http = require('http')
const https = require('https')
const express = require('express')
const cors = require('cors')
const config = require('./config/config')
const { sequelize } = require('./models')
const moduleLoader = require('./core/module.loader')
const migrator = require('./core/migrator')
const { seedSequences, seedHrmsPermissions, seedBillingPlans } = require('./core/seed')
const { pruneExpiredTokens } = require('./modules/auth/auth.service')
const cache = require('./config/redis')
const realtime = require('./core/realtime')
const logger = require('./core/logger')
const requestLogger = require('./middleware/request-logger')

const app = express() // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage -- stateless Bearer-token API; the only cookie (refresh) is httpOnly + SameSite=Strict, so CSRF is already mitigated without a token middleware

// Don't advertise the framework.
app.disable('x-powered-by')

// Trust the reverse proxy (if any) so req.secure / req.protocol reflect the
// original scheme via X-Forwarded-Proto — required for correct https detection
// and Secure cookies when TLS is terminated upstream.
if (config.trustProxy !== false) app.set('trust proxy', config.trustProxy)

// When both schemes are served, optionally bounce http → https.
if (config.https.enabled && config.https.redirectHttp) {
  app.use((req, res, next) => {
    if (req.secure) return next()
    const host = (req.headers.host || 'localhost').split(':')[0]
    return res.redirect(308, `https://${host}:${config.https.port}${req.originalUrl}`)
  })
}

// Baseline security headers. CSP is intentionally omitted here — the SPA is
// served separately (Vite/static host), so its CSP belongs with that host.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('X-DNS-Prefetch-Control', 'off')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  if (config.env === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  next()
})

// Core middleware
app.use(cors({ origin: config.clientUrl, credentials: true }))

// Most endpoints exchange small JSON only, so cap the body tightly to limit the
// memory-exhaustion surface from oversized payloads. A handful of routes
// legitimately accept large base64 bodies (file/logo uploads) and mount their
// own express.json with a higher limit — skip the global parser for those so
// the route-level parser runs. (A global parser consumes the request stream
// first, so without this carve-out it would reject large uploads at the smaller
// cap before they ever reach their own parser.)
const smallJson = express.json({ limit: '1mb' })
const LARGE_BODY_ROUTES = [
  /^\/api\/erp\/attachments(?:\/|$)/,    // base64 file attachments (≤ 15 MB)
  /^\/api\/organizations\/[^/]+\/logo$/, // base64 org logo upload
  /^\/api\/billing\/webhook\//,          // gateway webhook — needs the raw body for signature checks
]
app.use((req, res, next) => {
  if (LARGE_BODY_ROUTES.some((re) => re.test(req.path))) return next()
  return smallJson(req, res, next)
})
app.use(express.urlencoded({ extended: true }))
app.use(requestLogger)

// Public static — org logos and similar customer-facing assets.
app.use('/uploads/logos', express.static(path.join(__dirname, '..', 'uploads', 'logos')))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: config.env, timestamp: new Date().toISOString() })
})

async function bootstrap() {
  // Sync database
  await sequelize.authenticate()
  await sequelize.sync()
  await migrator.up(sequelize)
  await seedSequences()
  await seedHrmsPermissions()
  await seedBillingPlans()
  logger.info('Database connected and synced', { label: 'db' })

  // Initialise the cache (Redis when enabled, in-memory fallback otherwise).
  await cache.init()

  // Load all HMVC modules (auto-discovers server/modules/*/*.module.js)
  await moduleLoader.loadAll(app)

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` })
  })

  // Global error handler
  app.use((err, req, res, next) => {
    logger.error(err.message || 'Unhandled error', {
      label: 'http',
      stack:  err.stack,
      method: req.method,
      path:   req.originalUrl || req.url,
      status: err.status || 500,
    })
    res.status(err.status || 500).json({ success: false, message: 'Internal server error' })
  })

  // Always serve HTTP; additionally serve HTTPS when configured. Socket.IO is
  // attached to every server so realtime works over either scheme.
  const httpServer = http.createServer(app) // nosemgrep: problem-based-packs.insecure-transport.js-node.using-http-server.using-http-server -- intentional HTTP listener for HTTP/HTTPS dual-serving; TLS is provided by the HTTPS listener below or terminated by an upstream proxy
  const servers = [httpServer]

  let httpsServer = null
  if (config.https.enabled) {
    if (!config.https.keyPath || !config.https.certPath) {
      throw new Error('HTTPS_ENABLED is true but HTTPS_KEY_PATH / HTTPS_CERT_PATH are not set')
    }
    const credentials = {
      key:  fs.readFileSync(config.https.keyPath),
      cert: fs.readFileSync(config.https.certPath),
    }
    httpsServer = https.createServer(credentials, app)
    servers.push(httpsServer)
  }

  realtime.init(servers)

  httpServer.listen(config.port, () => {
    logger.info(`Server running on http://localhost:${config.port} (${config.env})`, { label: 'server' })
  })
  if (httpsServer) {
    httpsServer.listen(config.https.port, () => {
      logger.info(`Server running on https://localhost:${config.https.port} (${config.env})`, { label: 'server' })
    })
  }

  // Prune expired refresh tokens every hour
  setInterval(pruneExpiredTokens, 60 * 60 * 1000)
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrap error', { label: 'bootstrap', stack: err.stack, message: err.message })
  process.exit(1)
})
