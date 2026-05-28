/**
 * Module-aware migration runner with up / down support.
 *
 * Discovery: every directory named `migrations/` under the core platform dir
 * (server/migrations), the core modules (server/modules/*) and the shared
 * layer (shared/**) is scanned for `*.js` migration files. Files are ordered
 * globally by their filename (a `YYYYMMDD_NNNNNN_*` timestamp prefix), so a
 * migration's position is independent of which module owns it.
 *
 * Each migration file exports:
 *   module.exports = {
 *     async up(ctx)   { ... },   // apply the change
 *     async down(ctx) { ... },   // reverse the change
 *   }
 *
 * `ctx` carries the sequelize instance plus dialect-portable, idempotent
 * helpers (addColumn / removeColumn / addIndex / removeIndex / raw / …).
 * Helpers skip work that is already done (missing table, existing column),
 * which keeps `up` safe to run against databases that pre-date this runner —
 * the first `up` records every migration as applied without erroring.
 *
 * Applied migrations are tracked in the `SchemaMigrations` table.
 */
const fs = require('fs')
const path = require('path')
const { DataTypes } = require('sequelize')
const log = require('./logger').forLabel('migrator')

const CORE_PLATFORM_DIR = path.join(__dirname, '..', 'migrations')
const CORE_MODULES_DIR   = path.join(__dirname, '..', 'modules')
const SHARED_DIR         = path.join(__dirname, '..', '..', 'shared')

const TRACKING_TABLE = 'SchemaMigrations'

// ── Discovery ─────────────────────────────────────────────────────────────────

function filesInDir(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => path.join(dir, f))
}

// Recursively find every `migrations/` directory below `root` and return the
// migration files inside them. Does not descend into found migrations dirs or
// node_modules.
function walkForMigrationDirs(root) {
  if (!fs.existsSync(root)) return []
  const out = []
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    if (entry.name === 'node_modules') continue
    const full = path.join(root, entry.name)
    if (entry.name === 'migrations') out.push(...filesInDir(full))
    else out.push(...walkForMigrationDirs(full))
  }
  return out
}

function collectMigrationFiles() {
  const files = [
    ...filesInDir(CORE_PLATFORM_DIR),
    ...walkForMigrationDirs(CORE_MODULES_DIR),
    ...walkForMigrationDirs(SHARED_DIR),
  ]
  // Filenames are the migration identity and must be globally unique.
  const seen = new Map()
  for (const f of files) {
    const name = path.basename(f, '.js')
    if (seen.has(name)) {
      throw new Error(`Duplicate migration name "${name}": ${seen.get(name)} vs ${f}`)
    }
    seen.set(name, f)
  }
  return [...seen.entries()]
    .map(([name, file]) => ({ name, file }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

// Resolve a user-supplied query to a single migration: exact name first, then
// a unique substring match. Throws on no match or an ambiguous one.
function resolveMigration(query, migrations = collectMigrationFiles()) {
  const exact = migrations.find((m) => m.name === query)
  if (exact) return exact
  const matches = migrations.filter((m) => m.name.includes(query))
  if (matches.length === 1) return matches[0]
  if (matches.length === 0) throw new Error(`No migration matches "${query}"`)
  throw new Error(`"${query}" is ambiguous — matches: ${matches.map((m) => m.name).join(', ')}`)
}

// ── Idempotent helper context ───────────────────────────────────────────────

function makeContext(sequelize) {
  const qi = sequelize.getQueryInterface()

  const tableExists = async (table) => {
    try { await qi.describeTable(table); return true } catch { return false }
  }
  const columnExists = async (table, column) => {
    try { const d = await qi.describeTable(table); return Object.prototype.hasOwnProperty.call(d, column) }
    catch { return false }
  }

  return {
    sequelize,
    queryInterface: qi,
    DataTypes,

    tableExists,
    columnExists,

    // Add a column only if its table exists and the column does not.
    async addColumn(table, column, attribute) {
      if (!(await tableExists(table))) return
      if (await columnExists(table, column)) return
      await qi.addColumn(table, column, attribute)
    },

    // Drop a column only if it exists. On SQLite we use native DROP COLUMN
    // (SQLite >= 3.35) instead of Sequelize's table-rebuild, which otherwise
    // trips foreign-key constraints when other tables reference this one.
    // Dependent indexes are dropped by their own (earlier-reverting) migration.
    async removeColumn(table, column) {
      if (!(await columnExists(table, column))) return
      if (sequelize.getDialect() === 'sqlite') {
        await sequelize.query(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``)
      } else {
        await qi.removeColumn(table, column)
      }
    },

    // Create an index; skips if the table or any indexed column is missing,
    // and tolerates an index that already exists.
    async addIndex(table, fields, options = {}) {
      if (!(await tableExists(table))) return
      for (const f of fields) {
        if (!(await columnExists(table, f))) {
          log.debug(`Skipping index on ${table}(${fields.join(', ')}) — column "${f}" not present`)
          return
        }
      }
      try {
        await qi.addIndex(table, fields, options)
      } catch (err) {
        if (!/already exists/i.test(err.message || '')) throw err
      }
    },

    // Remove an index by name (or field list); tolerant of a missing index.
    async removeIndex(table, nameOrFields) {
      try { await qi.removeIndex(table, nameOrFields) } catch { /* already gone */ }
    },

    // Escape hatch for table-recreation / DDL the helpers don't cover.
    raw: (sql, options) => sequelize.query(sql, options),

    // Best-effort data backfill: tolerates a missing table/column so a backfill
    // that depends on a column added by a later migration never aborts boot.
    // (On a fresh database sync() has already created every column, so these
    // run fully; on legacy databases they are advisory, as in the old runner.)
    async rawSafe(sql, options) {
      try {
        return await sequelize.query(sql, options)
      } catch (err) {
        const m = err.message || ''
        const benign = /no such table|no such column|has no column|duplicate column|already exists/i.test(m)
        if (!benign) throw err
        log.debug(`Skipped backfill (${m.split('\n')[0]})`)
        return null
      }
    },
  }
}

// ── Tracking table ────────────────────────────────────────────────────────────

async function ensureTrackingTable(sequelize) {
  const qi = sequelize.getQueryInterface()
  try { await qi.describeTable(TRACKING_TABLE); return } catch { /* needs creating */ }
  await qi.createTable(TRACKING_TABLE, {
    name:      { type: DataTypes.STRING, primaryKey: true },
    appliedAt: { type: DataTypes.DATE, allowNull: false },
  })
}

async function appliedNames(sequelize) {
  const [rows] = await sequelize.query(`SELECT name FROM ${TRACKING_TABLE}`)
  return new Set(rows.map((r) => r.name))
}

// Most-recently-applied first (for rollback ordering).
async function appliedNamesDesc(sequelize) {
  const [rows] = await sequelize.query(
    `SELECT name FROM ${TRACKING_TABLE} ORDER BY appliedAt DESC, name DESC`
  )
  return rows.map((r) => r.name)
}

async function recordApplied(sequelize, name) {
  await sequelize.query(
    `INSERT INTO ${TRACKING_TABLE} (name, appliedAt) VALUES (?, ?)`,
    { replacements: [name, new Date().toISOString()] }
  )
}

async function recordReverted(sequelize, name) {
  await sequelize.query(`DELETE FROM ${TRACKING_TABLE} WHERE name = ?`, { replacements: [name] })
}

// ── Public API ──────────────────────────────────────────────────────────────

async function up(sequelize, { only } = {}) {
  await ensureTrackingTable(sequelize)
  const applied = await appliedNames(sequelize)
  const ctx = makeContext(sequelize)
  let migrations = collectMigrationFiles()

  if (only) {
    const target = resolveMigration(only, migrations)
    if (applied.has(target.name)) {
      log.info(`Already applied: ${target.name}`)
      return 0
    }
    migrations = [target]
  }

  let count = 0
  for (const { name, file } of migrations) {
    if (applied.has(name)) continue
    const migration = require(file)
    if (typeof migration.up !== 'function') {
      log.warn(`Migration "${name}" has no up() — skipping`)
      continue
    }
    try {
      await migration.up(ctx)
      await recordApplied(sequelize, name)
      count++
      log.debug(`Applied: ${name}`)
    } catch (err) {
      log.error(`Migration failed: ${name}`, { error: err.message })
      throw err
    }
  }
  log.info(count > 0 ? `Applied ${count} migration(s)` : 'No pending migrations')
  return count
}

async function down(sequelize, { steps = 1, name } = {}) {
  await ensureTrackingTable(sequelize)
  const ctx = makeContext(sequelize)
  const all = collectMigrationFiles()
  const byName = new Map(all.map((m) => [m.name, m.file]))

  let toRevert
  if (name) {
    const target = resolveMigration(name, all)
    const applied = await appliedNames(sequelize)
    if (!applied.has(target.name)) {
      log.info(`Not applied, nothing to roll back: ${target.name}`)
      return 0
    }
    toRevert = [target.name]
  } else {
    toRevert = (await appliedNamesDesc(sequelize)).slice(0, steps)
  }

  let count = 0
  for (const name of toRevert) {
    const file = byName.get(name)
    if (!file) {
      log.warn(`Applied migration "${name}" has no file — clearing its record only`)
      await recordReverted(sequelize, name)
      continue
    }
    const migration = require(file)
    if (typeof migration.down === 'function') {
      try {
        await migration.down(ctx)
      } catch (err) {
        log.error(`Rollback failed: ${name}`, { error: err.message })
        throw err
      }
    } else {
      log.warn(`Migration "${name}" has no down() — record removed without schema change`)
    }
    await recordReverted(sequelize, name)
    count++
    log.info(`Rolled back: ${name}`)
  }
  if (count === 0) log.info('Nothing to roll back')
  return count
}

async function status(sequelize) {
  await ensureTrackingTable(sequelize)
  const applied = await appliedNames(sequelize)
  return collectMigrationFiles().map(({ name }) => ({ name, applied: applied.has(name) }))
}

module.exports = { up, down, status, collectMigrationFiles }
