/**
 * Boot-time creator for the registry-driven performance indexes.
 *
 * These tenant/foreign-key indexes used to be created by per-module
 * `*_audit_indexes` migrations. Folding the logic here means a fresh
 * `sequelize.sync()` database gets the same indexes with no migration files —
 * the rules stay registry-driven (see ./audit-indexes), so a new model picks up
 * its indexes automatically without editing each `*.model.js`.
 *
 * Requiring ./index guarantees the full registry — including cross-domain
 * associations that inject foreign-key columns like Order.salespersonId — is
 * loaded before we read `rawAttributes`.
 */
const models = require('./index')
const { allIndexSpecs } = require('./audit-indexes')
const log = require('../core/logger').forLabel('perf-indexes')

// Idempotent: skips an index that already exists (re-run safe across boots).
async function applyPerfIndexes(sequelize) {
  const qi = sequelize.getQueryInterface()
  const specs = allIndexSpecs(models)
  for (const { table, fields, name } of specs) {
    try {
      await qi.addIndex(table, fields, { name })
    } catch (err) {
      if (!/already exists/i.test(err.message || '')) throw err
    }
  }
  log.debug(`Ensured ${specs.length} performance index(es)`)
}

module.exports = { applyPerfIndexes }
