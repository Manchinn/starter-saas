require('dotenv').config()
const path = require('path')
const express = require('express')
const cors = require('cors')
const config = require('./config/config')
const { sequelize } = require('./models')
const moduleLoader = require('./core/module.loader')
const migrator = require('./core/migrator')
const { seedSequences } = require('./core/seed')
const { pruneExpiredTokens } = require('./modules/auth/auth.service')
const cache = require('./config/redis')
const logger = require('./core/logger')
const requestLogger = require('./middleware/request-logger')

const app = express()

// Core middleware
app.use(cors({ origin: config.clientUrl, credentials: true }))
// Logos are uploaded as base64; the JSON body cap needs to be larger than a
// typical PNG/JPEG (the upload service still rejects > 2 MB per file).
app.use(express.json({ limit: '5mb' }))
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

  app.listen(config.port, () => {
    logger.info(`Server running on http://localhost:${config.port} (${config.env})`, { label: 'server' })
  })

  // Prune expired refresh tokens every hour
  setInterval(pruneExpiredTokens, 60 * 60 * 1000)
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrap error', { label: 'bootstrap', stack: err.stack, message: err.message })
  process.exit(1)
})
