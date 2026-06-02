/**
 * Backfill the record-keeping columns onto the tables that previously lacked
 * them, and create the performance indexes for the whole schema.
 *
 * On a fresh database `sequelize.sync()` has already created every column from
 * the models, so the addColumn calls below are no-ops there; on a pre-existing
 * database they add the now-declared columns. Indexes are *not* created by
 * `sync()` for already-existing tables, so this migration is what brings index
 * coverage to fresh and legacy databases alike (it runs on every boot, right
 * after sync — see server/app.js).
 *
 * The index set is derived from the live model registry via
 * server/models/audit-indexes.js, so it stays in step with the models without
 * a hand-maintained list. All helpers are idempotent: addColumn skips existing
 * columns, addIndex skips when the table/column is missing or the index already
 * exists.
 */
const models = require('../models')
const { allIndexSpecs } = require('../models/audit-indexes')

// The models that gained recordFields in this change. createdAt / updatedAt are
// added too for the former join tables that ran with `timestamps: false`;
// addColumn skips them where Sequelize's implicit timestamps already exist.
const NEWLY_COVERED_MODELS = [
  // Core platform / auth / RBAC
  'User', 'Module', 'Permission', 'Role', 'RefreshToken',
  'RoleModule', 'RolePermission', 'UserModule', 'UserRole',
  // Billing / subscriptions
  'Plan', 'Subscription', 'SubscriptionInvoice', 'UsageCounter',
  // Shared (ERP / HRMS) join & catalog tables
  'AlertRead', 'StoreStock', 'ProductStore', 'ProductVendor', 'SalePackageItem',
  'Sequence', 'Setting',
  'EmployeeDepartment', 'EmployeeRole', 'HrmsPermission', 'HrmsRolePermission',
]

function tableFor(modelName) {
  const m = models[modelName]
  if (!m) return null
  const t = m.getTableName()
  return typeof t === 'string' ? t : t.tableName
}

module.exports = {
  async up(ctx) {
    const text = { type: ctx.DataTypes.TEXT }
    const flag = { type: ctx.DataTypes.INTEGER, defaultValue: 1 }
    const date = { type: ctx.DataTypes.DATE }

    // 1) Record-keeping columns on the newly-covered tables.
    for (const modelName of NEWLY_COVERED_MODELS) {
      const table = tableFor(modelName)
      if (!table) continue
      await ctx.addColumn(table, 'dataFlag', flag)
      await ctx.addColumn(table, 'createdBy', text)
      await ctx.addColumn(table, 'modifiedBy', text)
      await ctx.addColumn(table, 'createdAt', date)
      await ctx.addColumn(table, 'updatedAt', date)
    }

    // 2) Performance indexes for every model (tenant + soft-delete composite
    //    and UUID foreign-key columns), derived from the registry.
    for (const { table, fields, name } of allIndexSpecs(models)) {
      await ctx.addIndex(table, fields, { name })
    }
  },

  async down(ctx) {
    // Drop the indexes (always reversible — index-only).
    for (const { table, name } of allIndexSpecs(models)) {
      await ctx.removeIndex(table, name)
    }

    // Remove the columns this migration introduced on the newly-covered tables.
    // createdAt / updatedAt are intentionally left in place: on the non-join
    // tables they predate this migration (Sequelize's implicit timestamps), so
    // dropping them would discard data this migration never created.
    for (const modelName of NEWLY_COVERED_MODELS) {
      const table = tableFor(modelName)
      if (!table) continue
      await ctx.removeColumn(table, 'modifiedBy')
      await ctx.removeColumn(table, 'createdBy')
      await ctx.removeColumn(table, 'dataFlag')
    }
  },
}
