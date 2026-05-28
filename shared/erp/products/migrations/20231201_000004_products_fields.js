// Product category code, plus product reorder points.
module.exports = {
  async up(ctx) {
    await ctx.addColumn('ProductCategories', 'code', { type: ctx.DataTypes.TEXT })
    await ctx.addColumn('Products', 'reorderPoint', { type: ctx.DataTypes.INTEGER })
    await ctx.addColumn('Products', 'reorderQty', { type: ctx.DataTypes.INTEGER })
  },
  async down(ctx) {
    await ctx.removeColumn('Products', 'reorderQty')
    await ctx.removeColumn('Products', 'reorderPoint')
    await ctx.removeColumn('ProductCategories', 'code')
  },
}
