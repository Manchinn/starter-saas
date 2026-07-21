require('dotenv').config()
const path = require('path')
const http = require('http')
const express = require('express')
const cors = require('cors')
const config = require('./config/config')
const { sequelize } = require('./models')
const moduleLoader = require('./core/module.loader')
const migrator = require('./core/migrator')
const { seedSequences } = require('./core/seed')
const { pruneExpiredTokens } = require('./modules/auth/auth.service')
const cache = require('./config/redis')
const realtime = require('./core/realtime')
const logger = require('./core/logger')
const requestLogger = require('./middleware/request-logger')

const app = express()

// Don't advertise the framework.
app.disable('x-powered-by')

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
// Logos are uploaded as base64; the JSON body cap needs to be larger than a
// typical PNG/JPEG (the upload service still rejects > 2 MB per file).
app.use(express.json({
  limit: '5mb',
  // LINE signs the exact request bytes. Keep them only for the webhook so the
  // handler can validate the signature before it reads any event payload.
  verify: (req, res, buffer) => {
    if (req.path === '/api/line/webhook') req.rawBody = Buffer.from(buffer)
  },
}))
app.use(express.urlencoded({ extended: true }))
app.use(requestLogger)

// Public static — org logos and similar customer-facing assets.
app.use('/uploads/logos', express.static(path.join(__dirname, '..', 'uploads', 'logos')))

// Health check endpoints
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    await sequelize.authenticate()

    // Check Redis connection (if enabled)
    let redisStatus = 'disabled'
    if (config.redis.enabled) {
      try {
        await cache.ping()
        redisStatus = 'connected'
      } catch (err) {
        redisStatus = 'error'
      }
    }

    res.json({
      status: 'ok',
      env: config.env,
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: redisStatus
      }
    })
  } catch (error) {
    logger.error('Health check failed:', error)
    res.status(503).json({
      status: 'error',
      env: config.env,
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
})

// Readiness check (for Kubernetes/Docker)
app.get('/api/ready', async (req, res) => {
  try {
    await sequelize.authenticate()
    res.json({ status: 'ready' })
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message })
  }
})

// Liveness check (for Kubernetes/Docker)
app.get('/api/live', (req, res) => {
  res.json({ status: 'alive' })
})

async function bootstrap() {
  // Sync database
  await sequelize.authenticate()
  await sequelize.sync()
  await migrator.up(sequelize)
  await seedSequences()
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

  const server = http.createServer(app)
  realtime.init(server)

  server.listen(config.port, () => {
    logger.info(`Server running on http://localhost:${config.port} (${config.env})`, { label: 'server' })
  })

  // Prune expired refresh tokens every hour
  const pruneInterval = setInterval(pruneExpiredTokens, 60 * 60 * 1000)

  // Graceful shutdown handler
  const shutdown = async (signal) => {
    logger.info(`${signal} received, closing connections gracefully...`, { label: 'shutdown' })
    clearInterval(pruneInterval)

    server.close(async () => {
      logger.info('HTTP server closed', { label: 'shutdown' })
      try {
        await sequelize.close()
        logger.info('Database connection closed', { label: 'shutdown' })
        await cache.disconnect()
        logger.info('Redis connection closed', { label: 'shutdown' })
        process.exit(0)
      } catch (err) {
        logger.error('Error during shutdown', { label: 'shutdown', error: err.message })
        process.exit(1)
      }
    })

    // Force exit after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Shutdown timeout, forcing exit', { label: 'shutdown' })
      process.exit(1)
    }, 10000)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrap error', { label: 'bootstrap', stack: err.stack, message: err.message })
  process.exit(1)
})
