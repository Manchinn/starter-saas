// Per-line price override on sale-package items.
module.exports = {
  async up(ctx) {
    await ctx.addColumn('sale_package_items', 'unitPrice', { type: ctx.DataTypes.FLOAT })
  },
  async down(ctx) {
    await ctx.removeColumn('sale_package_items', 'unitPrice')
  },
}
