/**
 * Add `amountPaid` to vendor_bills (drives balanceDue + AP aging + vendor
 * payment allocation). Fresh DBs get it from sync(); existing DBs via this
 * idempotent migration.
 */
const TABLE = 'vendor_bills'

module.exports = {
  async up(ctx) {
    await ctx.addColumn(TABLE, 'amountPaid', { type: ctx.DataTypes.DECIMAL(15, 2), allowNull: true, defaultValue: 0 })
  },
  async down(ctx) {
    await ctx.removeColumn(TABLE, 'amountPaid')
  },
}
