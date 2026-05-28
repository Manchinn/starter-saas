// Pricing: customer-group scope, code, and sale-item link.
const COLUMNS = ['customerGroupId', 'code', 'saleItemId']

module.exports = {
  async up(ctx) {
    for (const col of COLUMNS) await ctx.addColumn('Pricings', col, { type: ctx.DataTypes.TEXT })
  },
  async down(ctx) {
    for (const col of [...COLUMNS].reverse()) await ctx.removeColumn('Pricings', col)
  },
}
