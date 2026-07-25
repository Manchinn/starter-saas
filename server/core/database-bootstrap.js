const migrator = require('./migrator')
const { applyPerfIndexes } = require('../models/apply-perf-indexes')
const { seedSequences, seedHrmsPermissions, seedBillingPlans } = require('./seed')
const log = require('./logger').forLabel('db-bootstrap')

async function provisionDatabase(sequelize, { seed = false } = {}) {
  await sequelize.authenticate()
  await sequelize.sync()
  await migrator.up(sequelize)
  await applyPerfIndexes(sequelize)

  if (seed) {
    await seedSequences()
    await seedHrmsPermissions()
    await seedBillingPlans()
  }

  log.info(seed ? 'Database provisioned and seeded' : 'Database provisioned')
}

module.exports = { provisionDatabase }
