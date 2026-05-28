// Lock flag that freezes stock movement while a physical count is in progress.
// (Formerly scripts/add_movement_locked_column.js.)
module.exports = {
  async up(ctx) {
    await ctx.addColumn('StockCounts', 'movementLocked', { type: ctx.DataTypes.BOOLEAN, defaultValue: false })
  },
  async down(ctx) {
    await ctx.removeColumn('StockCounts', 'movementLocked')
  },
}
