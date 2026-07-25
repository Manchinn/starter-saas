#!/usr/bin/env node
require('dotenv').config()

const { sequelize } = require('../models')
const { provisionDatabase } = require('../core/database-bootstrap')
const log = require('../core/logger').forLabel('db-provision')

async function main() {
  const seed = process.argv.includes('--seed')
  await provisionDatabase(sequelize, { seed })
}

main()
  .catch((err) => {
    log.error('Database provision failed', { error: err.message, stack: err.stack })
    process.exitCode = 1
  })
  .finally(() => sequelize.close())
