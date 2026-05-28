// Customer → CustomerGroup association.
module.exports = {
  async up(ctx) {
    await ctx.addColumn('Customers', 'customerGroupId', { type: ctx.DataTypes.TEXT })
  },
  async down(ctx) {
    await ctx.removeColumn('Customers', 'customerGroupId')
  },
}
