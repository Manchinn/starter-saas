#!/usr/bin/env node
require('dotenv').config()

const fs = require('fs')
const path = require('path')
const target = require('../config/database')
const log = require('../core/logger').forLabel('db-validate')
const {
  Sequelize,
  parseArgs,
  requireSourcePath,
  listSqliteTables,
  listTargetTables,
  tableCount,
} = require('../core/sqlite-postgres-transfer')

async function primaryKeyValues(sequelize, table) {
  const columns = await sequelize.getQueryInterface().describeTable(table)
  const keys = Object.entries(columns).filter(([, column]) => column.primaryKey).map(([name]) => name)
  if (keys.length === 0) return null
  const qi = sequelize.getQueryInterface().queryGenerator
  const quotedTable = qi.quoteTable(table)
  const selected = keys.map((key) => qi.quoteIdentifier(key)).join(', ')
  const rows = await sequelize.query(`SELECT ${selected} FROM ${quotedTable} ORDER BY ${selected}`)
  return JSON.stringify(rows[0])
}

async function migrationNames(sequelize) {
  const qi = sequelize.getQueryInterface().queryGenerator
  const table = qi.quoteTable('SchemaMigrations')
  try {
    const [rows] = await sequelize.query(`SELECT name FROM ${table} ORDER BY name`)
    return rows.map((row) => row.name)
  } catch {
    return []
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const sourcePath = path.resolve(requireSourcePath(args))
  if (!fs.existsSync(sourcePath)) throw new Error(`SQLite source database does not exist: ${sourcePath}`)
  if (target.getDialect() !== 'postgres') throw new Error('DB_DIALECT must be postgres for transfer validation')

  const source = new Sequelize({ dialect: 'sqlite', storage: sourcePath, logging: false })
  try {
    await source.authenticate()
    await target.authenticate()

    const sourceTables = await listSqliteTables(source)
    const targetTables = new Set(await listTargetTables(target))
    const failures = []

    for (const table of sourceTables) {
      if (!targetTables.has(table)) {
        failures.push(`${table}: missing from target schema`)
        continue
      }
      const [sourceCount, targetCount] = await Promise.all([tableCount(source, table), tableCount(target, table)])
      if (sourceCount !== targetCount) {
        failures.push(`${table}: source has ${sourceCount} row(s), target has ${targetCount}`)
        continue
      }
      const [sourceKeys, targetKeys] = await Promise.all([primaryKeyValues(source, table), primaryKeyValues(target, table)])
      if (sourceKeys !== null && sourceKeys !== targetKeys) failures.push(`${table}: primary-key values differ`)
    }

    const migrations = await migrationNames(target)
    if (migrations.length === 0) failures.push('SchemaMigrations is empty or unavailable on target')

    const unvalidated = await target.query(
      `SELECT conrelid::regclass::text AS table_name, conname
       FROM pg_constraint
       WHERE contype = 'f' AND NOT convalidated`,
      { type: Sequelize.QueryTypes.SELECT }
    )
    if (unvalidated.length > 0) {
      failures.push(`Target has unvalidated foreign keys: ${unvalidated.map((row) => `${row.table_name}.${row.conname}`).join(', ')}`)
    }

    if (failures.length > 0) throw new Error(`Transfer validation failed:\n- ${failures.join('\n- ')}`)
    log.info(`Transfer validation passed for ${sourceTables.length} table(s); ${migrations.length} migration(s) recorded`, { sourcePath })
  } finally {
    await source.close()
    await target.close()
  }
}

main().catch((err) => {
  log.error('PostgreSQL transfer validation failed', { error: err.message, stack: err.stack })
  process.exitCode = 1
})
