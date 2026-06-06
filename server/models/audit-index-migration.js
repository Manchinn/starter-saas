/**
 * Shared engine for the per-module performance-index migrations.
 *
 * The audit/performance indexes used to be created by one platform migration
 * (20260602_000003_audit_fields_indexes) that walked the *entire* model
 * registry. That has been split so each module owns the indexes for its own
 * models — but the rules stay registry-driven (see ./audit-indexes), so a new
 * model in a module still picks up its indexes automatically, no hand-edited
 * list required.
 *
 * Requiring ./index here guarantees the full registry — including the
 * cross-domain associations that inject foreign-key columns like Order
 * .salespersonId — is loaded before we read `rawAttributes`. Sequelize models
 * are singletons, so a model required from its own `models/` dir is the same,
 * fully-associated instance that lives in the registry.
 */
const fs = require('fs')
const path = require('path')
require('./index') // ensure every model + association is registered
const { indexSpecs } = require('./audit-indexes')

const isModel = (m) => m && m.rawAttributes && typeof m.getTableName === 'function'

// The models defined in the `models/` folder that sits beside a migration's
// `migrations/` folder (i.e. `<module>/models/*.model.js`).
function modelsBesideMigration(migrationDir) {
  const dir = path.join(migrationDir, '..', 'models')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.model.js'))
    .map((f) => require(path.join(dir, f))) // nosemgrep: path-traversal -- fixed sibling dir; names from readdirSync
    .filter(isModel)
}

async function applyIndexes(ctx, models) {
  for (const model of models) {
    for (const { table, fields, name } of indexSpecs(model)) {
      await ctx.addIndex(table, fields, { name })
    }
  }
}

async function dropIndexes(ctx, models) {
  for (const model of models) {
    for (const { table, name } of indexSpecs(model)) {
      await ctx.removeIndex(table, name)
    }
  }
}

// Convenience for the common case: a shared module whose models live in a
// sibling `models/` dir. `up(__dirname)` / `down(__dirname)` give ready-made
// migration hooks. Core modules (whose models live in server/models, not a
// sibling dir) call applyIndexes/dropIndexes with an explicit model list.
const up   = (migrationDir) => (ctx) => applyIndexes(ctx, modelsBesideMigration(migrationDir))
const down = (migrationDir) => (ctx) => dropIndexes(ctx, modelsBesideMigration(migrationDir))

module.exports = { applyIndexes, dropIndexes, modelsBesideMigration, up, down }
