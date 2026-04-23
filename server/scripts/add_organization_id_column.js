require('dotenv').config()
const { sequelize } = require('../models')

async function migrate() {
  try {
    await sequelize.authenticate()
    console.log('[Migration] Database connected.')

    // Add organizationId to Employees and Users via sync
    await sequelize.sync({ alter: true })
    console.log('[Migration] Database schema altered and synced.')

    console.log('[Migration] Success.')
    process.exit(0)
  } catch (err) {
    console.error('[Migration] Failed:', err)
    process.exit(1)
  }
}

migrate()
