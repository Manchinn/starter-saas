/**
 * Module-aware seed runner (companion to ./migrator).
 *
 * Discovery: every `seeds/` directory under server/modules/* and shared/** is
 * scanned for `*.js` seed files. Each file exports:
 *
 *   module.exports = {
 *     name:  'products',     // optional; defaults to the filename
 *     tier:  'demo',         // 'core' (reference data) | 'demo' (sample data)
 *     order: 150,            // global run order (lower runs first)
 *     async run(ctx) { ... },
 *   }
 *
 * Seeds run in ascending `order` so cross-module dependencies resolve (e.g.
 * products before sale items before pricing). Created rows are shared through
 * a context bag: a seed calls `ctx.set('products', rows)` and a later seed
 * reads `ctx.get('products')`. `ctx.models` exposes the full model registry so
 * seed files never need brittle relative requires.
 *
 * Tiers:
 *   - core: idempotent reference data (permissions, roles, master data).
 *   - demo: sample/demo data. Always runs core first so its refs are present.
 */
const fs = require('fs')
const path = require('path')
const log = require('./logger').forLabel('seeder')

const CORE_MODULES_DIR = path.join(__dirname, '..', 'modules')
const SHARED_DIR        = path.join(__dirname, '..', '..', 'shared')

const TIERS = ['core', 'demo']

// ── Discovery ─────────────────────────────────────────────────────────────────

function seedFilesIn(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => path.join(dir, f))
}

function walkForSeedDirs(root) {
  if (!fs.existsSync(root)) return []
  const out = []
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'node_modules') continue
    const full = path.join(root, entry.name)
    if (entry.name === 'seeds') out.push(...seedFilesIn(full))
    else out.push(...walkForSeedDirs(full))
  }
  return out
}

function collectSeeds() {
  const files = [...walkForSeedDirs(CORE_MODULES_DIR), ...walkForSeedDirs(SHARED_DIR)]
  const names = new Set()
  const seeds = files.map((file) => {
    const mod = require(file)
    const name = mod.name || path.basename(file, '.js')
    if (typeof mod.run !== 'function') throw new Error(`Seed "${name}" (${file}) must export run(ctx)`)
    if (mod.tier && !TIERS.includes(mod.tier)) throw new Error(`Seed "${name}" has unknown tier "${mod.tier}"`)
    if (names.has(name)) throw new Error(`Duplicate seed name "${name}"`)
    names.add(name)
    return { name, file, tier: mod.tier || 'core', order: mod.order ?? 1000, run: mod.run }
  })
  return seeds.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
}

// ── Context bag ───────────────────────────────────────────────────────────────

function makeContext(sequelize) {
  const models = require('../models')
  const store = new Map()
  return {
    sequelize,
    models,
    log,
    set: (key, value) => { store.set(key, value); return value },
    get: (key) => store.get(key),
    has: (key) => store.has(key),
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Run seeds for the requested tiers.
 * @param {Sequelize} sequelize
 * @param {{ tiers?: string[], reset?: boolean }} options
 *   tiers — which tiers to run (default ['core']). 'demo' implies 'core'.
 *   reset — when true, sync({ force: true }) drops & recreates all tables first.
 */
async function run(sequelize, { tiers = ['core'], reset = false } = {}) {
  const active = new Set(tiers)
  if (active.has('demo')) active.add('core') // demo seeds depend on core refs

  if (reset) {
    log.warn('Resetting database (sync force: true) — all data will be dropped')
    // SQLite enforces FKs, so dropping referenced tables (e.g. Customers) fails;
    // disable enforcement around the drop/recreate, then restore it.
    const isSqlite = sequelize.getDialect() === 'sqlite'
    if (isSqlite) await sequelize.query('PRAGMA foreign_keys = OFF')
    await sequelize.sync({ force: true })
    if (isSqlite) await sequelize.query('PRAGMA foreign_keys = ON')
  }

  const ctx = makeContext(sequelize)
  const seeds = collectSeeds().filter((s) => active.has(s.tier))

  for (const seed of seeds) {
    await seed.run(ctx)
    log.info(`Seeded: ${seed.name}`)
  }
  log.info(`Done — ran ${seeds.length} seed(s) for tier(s): ${[...active].join(', ')}`)
  return ctx
}

module.exports = { run, collectSeeds }
