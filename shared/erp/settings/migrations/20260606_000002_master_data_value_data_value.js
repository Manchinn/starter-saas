/**
 * Add the generic `dataValue` column to MasterDataValues.
 *
 * Fresh databases get it from `sequelize.sync()`; this idempotent migration
 * adds it to existing ones (the helper no-ops when the column already exists).
 */
const TABLE = 'MasterDataValues'

module.exports = {
  async up(ctx) {
    await ctx.addColumn(TABLE, 'dataValue', { type: ctx.DataTypes.STRING, allowNull: true })
  },

  async down(ctx) {
    await ctx.removeColumn(TABLE, 'dataValue')
  },
}
