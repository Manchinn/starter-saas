#!/usr/bin/env node
require('dotenv').config()

const fs = require('fs')
const path = require('path')
const target = require('../config/database')
const log = require('../core/logger').forLabel('db-transfer')
const {
  Sequelize,
  parseArgs,
  requireSourcePath,
  listSqliteTables,
  listTargetTables,
  tableDependencies,
  topologicalOrder,
  ensureTargetEmpty,
  transferTable,
} = require('../core/sqlite-postgres-transfer')

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const sourcePath = path.resolve(requireSourcePath(args))
  const batchSize = Number(args['batch-size'] || 500)
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 5000) {
    throw new Error('--batch-size must be an integer between 1 and 5000')
  }
  if (!fs.existsSync(sourcePath)) throw new Error(`SQLite source database does not exist: ${sourcePath}`)
  if (target.getDialect() !== 'postgres') throw new Error('DB_DIALECT must be postgres for data transfer')

  const source = new Sequelize({ dialect: 'sqlite', storage: sourcePath, logging: false })
  try {
    await source.authenticate()
    await target.authenticate()

    const sourceTables = await listSqliteTables(source)
    const targetTables = await listTargetTables(target)
    const targetSet = new Set(targetTables)
    const missingTargetTables = sourceTables.filter((table) => !targetSet.has(table))
    if (missingTargetTables.length > 0) {
      throw new Error(`Target schema is missing source table(s): ${missingTargetTables.join(', ')}. Run db:provision first.`)
    }

    await ensureTargetEmpty(target, sourceTables)
    const dependencies = await tableDependencies(source, sourceTables)
    const tables = topologicalOrder(dependencies)

    let total = 0
    for (const table of tables) {
      const count = await transferTable(source, target, table, batchSize)
      total += count
      log.info(`Transferred ${count} row(s)`, { table })
    }
    log.info(`Transfer complete: ${total} row(s) across ${tables.length} table(s)`, { sourcePath })
  } finally {
    await source.close()
    await target.close()
  }
}

main().catch((err) => {
  log.error('SQLite-to-PostgreSQL transfer failed', { error: err.message, stack: err.stack })
  process.exitCode = 1
})
