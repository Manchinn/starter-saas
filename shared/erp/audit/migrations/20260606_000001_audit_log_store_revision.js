/**
 * Audit-log data-store revision (1M-record tuning).
 *
 * Brings an *existing* `audit_logs` table up to the shape declared in
 * audit-log.model.js. On a fresh database `sequelize.sync()` has already
 * created the columns and indexes, so every helper here no-ops (idempotent);
 * on an upgraded database it adds the new `method` / `ip` columns, creates the
 * org-prefixed composite indexes the keyset list query relies on, and drops the
 * legacy single-purpose indexes those composites supersede.
 */
const TABLE = 'audit_logs'

// Keep in sync with audit-log.model.js.
const NEW_INDEXES = [
  { name: 'audit_logs_org_created_id_idx', fields: ['organizationId', 'createdAt', 'id'] },
  { name: 'audit_logs_org_entity_idx',     fields: ['organizationId', 'entityType', 'entityId', 'createdAt'] },
  { name: 'audit_logs_org_user_idx',        fields: ['organizationId', 'userId', 'createdAt'] },
  { name: 'audit_logs_org_action_idx',      fields: ['organizationId', 'action', 'createdAt'] },
]

// Sequelize's default-named indexes from the previous model definition.
const LEGACY_INDEXES = [
  { name: 'audit_logs_entity_type_entity_id', fields: ['entityType', 'entityId'] },
  { name: 'audit_logs_user_id',               fields: ['userId'] },
  { name: 'audit_logs_created_at',            fields: ['createdAt'] },
]

module.exports = {
  async up(ctx) {
    const { DataTypes } = ctx
    await ctx.addColumn(TABLE, 'method', { type: DataTypes.STRING, allowNull: true })
    await ctx.addColumn(TABLE, 'ip',     { type: DataTypes.STRING, allowNull: true })

    for (const idx of NEW_INDEXES) {
      await ctx.addIndex(TABLE, idx.fields, { name: idx.name })
    }
    // Drop the legacy indexes the org-prefixed composites now cover.
    for (const idx of LEGACY_INDEXES) {
      await ctx.removeIndex(TABLE, idx.name)
    }
  },

  async down(ctx) {
    for (const idx of LEGACY_INDEXES) {
      await ctx.addIndex(TABLE, idx.fields, { name: idx.name })
    }
    for (const idx of NEW_INDEXES) {
      await ctx.removeIndex(TABLE, idx.name)
    }
    // Keep the new columns on down — they're nullable and harmless, and other
    // boots may already depend on them.
  },
}
