const { Sequelize, QueryTypes } = require('sequelize')

const MIGRATION_TABLES = new Set(['SchemaMigrations', 'schema_migrations'])

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const [key, inline] = arg.slice(2).split('=', 2)
    args[key] = inline === undefined ? argv[i + 1] : inline
    if (inline === undefined) i++
  }
  return args
}

function requireSourcePath(args) {
  const source = args.source
  if (!source || source.startsWith('--')) {
    throw new Error('Usage: --source <path-to-active-database.sqlite> [--batch-size <n>]')
  }
  return source
}

function quoteTable(sequelize, table) {
  return sequelize.getQueryInterface().queryGenerator.quoteTable(table)
}

function quoteColumn(sequelize, column) {
  return sequelize.getQueryInterface().queryGenerator.quoteIdentifier(column)
}

async function listSqliteTables(source) {
  const rows = await source.query(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    { type: QueryTypes.SELECT }
  )
  return rows.map((row) => row.name).filter((name) => !MIGRATION_TABLES.has(name))
}

async function listTargetTables(target) {
  const tables = await target.getQueryInterface().showAllTables()
  return tables.map((table) => typeof table === 'string' ? table : table.tableName)
    .filter((name) => !MIGRATION_TABLES.has(name))
}

async function tableDependencies(source, tables) {
  const known = new Set(tables)
  const dependencies = new Map(tables.map((table) => [table, new Set()]))

  for (const table of tables) {
    const rows = await source.query(`PRAGMA foreign_key_list(${quoteTable(source, table)})`, {
      type: QueryTypes.SELECT,
    })
    for (const row of rows) {
      if (known.has(row.table) && row.table !== table) dependencies.get(table).add(row.table)
    }
  }

  return dependencies
}

function topologicalOrder(dependencies) {
  const remaining = new Map([...dependencies].map(([table, deps]) => [table, new Set(deps)]))
  const ordered = []

  while (remaining.size > 0) {
    const ready = [...remaining.entries()]
      .filter(([, dependencies]) => dependencies.size === 0)
      .map(([table]) => table)
      .sort()
    if (ready.length === 0) {
      throw new Error(`Foreign-key dependency cycle found: ${[...remaining.keys()].sort().join(', ')}`)
    }
    for (const table of ready) {
      ordered.push(table)
      remaining.delete(table)
      for (const dependencies of remaining.values()) dependencies.delete(table)
    }
  }

  return ordered
}

function isBooleanType(type) {
  return /^BOOLEAN/i.test(type || '')
}

function isJsonType(type) {
  return /JSON/i.test(type || '')
}

function normalizeBoolean(value) {
  if (value === null || value === undefined || typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  return ['1', 'true', 't', 'yes'].includes(String(value).toLowerCase())
}

function normalizeValue(value, targetColumn) {
  if (value === null || value === undefined) return value
  if (isBooleanType(targetColumn.type)) return normalizeBoolean(value)
  if (isJsonType(targetColumn.type) && typeof value === 'string') {
    try { return JSON.stringify(JSON.parse(value)) } catch {
      throw new Error(`Invalid JSON value for target column ${targetColumn.field || 'unknown'}`)
    }
  }
  return value
}

async function ensureTargetEmpty(target, tables) {
  for (const table of tables) {
    const [row] = await target.query(`SELECT COUNT(*) AS count FROM ${quoteTable(target, table)}`)
    const count = Number(row[0]?.count || 0)
    if (count > 0) throw new Error(`Target table ${table} already contains ${count} row(s); provision a fresh target database before transfer`)
  }
}

async function transferTable(source, target, table, batchSize) {
  const targetColumns = await target.getQueryInterface().describeTable(table)
  const sourceColumns = await source.getQueryInterface().describeTable(table)
  const columns = Object.keys(sourceColumns)
  const missing = columns.filter((column) => !Object.prototype.hasOwnProperty.call(targetColumns, column))
  if (missing.length > 0) throw new Error(`Target table ${table} is missing source column(s): ${missing.join(', ')}`)

  const quotedTable = quoteTable(target, table)
  const quotedColumns = columns.map((column) => quoteColumn(target, column)).join(', ')
  let offset = 0
  let transferred = 0

  while (true) {
    const rows = await source.query(
      `SELECT * FROM ${quoteTable(source, table)} LIMIT ? OFFSET ?`,
      { replacements: [batchSize, offset], type: QueryTypes.SELECT }
    )
    if (rows.length === 0) break

    const placeholders = rows.map((_, rowIndex) => `(${columns.map((__, columnIndex) => `$${rowIndex * columns.length + columnIndex + 1}`).join(', ')})`).join(', ')
    const values = rows.flatMap((row) => columns.map((column) => normalizeValue(row[column], targetColumns[column])))
    try {
      await target.query(`INSERT INTO ${quotedTable} (${quotedColumns}) VALUES ${placeholders}`, { bind: values })
    } catch (err) {
      throw new Error(`Failed to transfer ${table} rows ${offset + 1}-${offset + rows.length}: ${err.message}`)
    }

    transferred += rows.length
    offset += rows.length
  }

  return transferred
}

async function tableCount(sequelize, table) {
  const [rows] = await sequelize.query(`SELECT COUNT(*) AS count FROM ${quoteTable(sequelize, table)}`)
  return Number(rows[0]?.count || 0)
}

async function foreignKeyViolations(target) {
  const rows = await target.query(
    `SELECT conrelid::regclass::text AS table_name, conname
     FROM pg_constraint
     WHERE contype = 'f' AND NOT convalidated`,
    { type: QueryTypes.SELECT }
  )
  return rows
}

module.exports = {
  MIGRATION_TABLES,
  Sequelize,
  parseArgs,
  requireSourcePath,
  listSqliteTables,
  listTargetTables,
  tableDependencies,
  topologicalOrder,
  normalizeValue,
  ensureTargetEmpty,
  transferTable,
  tableCount,
  foreignKeyViolations,
}
