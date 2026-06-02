/**
 * Performance-index strategy, derived from the live model registry.
 *
 * Centralising the rules here lets the same definition drive the migration
 * (`server/migrations/*_audit_fields_indexes.js`), which runs on every boot
 * after `sequelize.sync()` and so brings both fresh and existing databases to
 * the same shape. Keeping the rules registry-driven means new models pick up
 * their indexes automatically without editing each `*.model.js`.
 *
 * Per model:
 *   - `(organizationId, dataFlag)` composite when both columns exist — the
 *     canonical "active rows for this tenant" filter. A composite on
 *     `(organizationId, …)` also serves queries that filter on
 *     `organizationId` alone, so no separate single-column index is needed.
 *   - `organizationId` alone when the model has no `dataFlag`.
 *   - every UUID foreign-key column: a `*Id` attribute that is neither the
 *     primary key nor `organizationId` (e.g. customerId, orderId, productId,
 *     salespersonId). Speeds joins and reverse lookups. Non-UUID `*Id` columns
 *     (e.g. a string taxId) are intentionally skipped.
 *
 * `dataFlag` is never indexed on its own — its cardinality (mostly 1) makes a
 * standalone index near-useless; it earns its keep only as the trailing column
 * of the tenant composite.
 */

function tableNameOf(model) {
  const t = model.getTableName()
  return typeof t === 'string' ? t : t.tableName
}

// Index specs for a single model: [{ table, fields, name }].
function indexSpecs(model) {
  const attrs = model.rawAttributes || {}
  const has = (c) => Object.prototype.hasOwnProperty.call(attrs, c)
  const table = tableNameOf(model)
  const specs = []
  const add = (fields) => specs.push({ table, fields, name: `${table}_${fields.join('_')}_idx` })

  if (has('organizationId') && has('dataFlag')) add(['organizationId', 'dataFlag'])
  else if (has('organizationId')) add(['organizationId'])

  for (const name of Object.keys(attrs)) {
    if (name === 'organizationId') continue
    if (!/Id$/.test(name)) continue
    const a = attrs[name]
    if (a.primaryKey) continue
    if (!a.type || a.type.key !== 'UUID') continue
    add([name])
  }
  return specs
}

// Flatten the specs for every model in the registry (skips the `sequelize`
// instance and anything that isn't a Sequelize model).
function allIndexSpecs(models) {
  const out = []
  for (const key of Object.keys(models)) {
    const m = models[key]
    if (!m || !m.rawAttributes || typeof m.getTableName !== 'function') continue
    out.push(...indexSpecs(m))
  }
  return out
}

module.exports = { indexSpecs, allIndexSpecs, tableNameOf }
