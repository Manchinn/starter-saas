require('dotenv').config()
const express = require('express')
const cors = require('cors')
const config = require('./config/config')
const { sequelize } = require('./models')
const moduleLoader = require('./core/module.loader')
const { runMigrations, seedSequences } = require('./migrations')
const { pruneExpiredTokens } = require('./modules/auth/auth.service')

const app = express()

// Core middleware
app.use(cors({ origin: config.clientUrl, credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: config.env, timestamp: new Date().toISOString() })
})

async function bootstrap() {
  // Sync database
  await sequelize.authenticate()
  await sequelize.sync()
  await runMigrations(sequelize)
  await seedSequences()
  console.log('[DB] Connected and synced.')

  // Load all HMVC modules (auto-discovers server/modules/*/*.module.js)
  await moduleLoader.loadAll(app)

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` })
  })

  // Global error handler
  app.use((err, req, res, next) => {
    console.error(err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  })

  app.listen(config.port, () => {
    console.log(`[Server] Running on http://localhost:${config.port} (${config.env})`)
  })

  // Prune expired refresh tokens every hour
  setInterval(pruneExpiredTokens, 60 * 60 * 1000)
}

bootstrap().catch((err) => {
  console.error('[Bootstrap] Fatal error:', err)
  process.exit(1)
})
