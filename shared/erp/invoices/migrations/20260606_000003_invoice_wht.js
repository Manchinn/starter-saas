/**
 * Add withholding-tax (WHT) columns to Invoices.
 *
 * Fresh databases get them from `sequelize.sync()`; this idempotent migration
 * adds them to existing ones (the helper no-ops when a column already exists).
 */
const TABLE = 'Invoices'

module.exports = {
  async up(ctx) {
    await ctx.addColumn(TABLE, 'whtCode',   { type: ctx.DataTypes.STRING, allowNull: true })
    await ctx.addColumn(TABLE, 'whtRate',   { type: ctx.DataTypes.DECIMAL(5, 2),  allowNull: false, defaultValue: 0 })
    await ctx.addColumn(TABLE, 'whtAmount', { type: ctx.DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 })
  },

  async down(ctx) {
    await ctx.removeColumn(TABLE, 'whtCode')
    await ctx.removeColumn(TABLE, 'whtRate')
    await ctx.removeColumn(TABLE, 'whtAmount')
  },
}
