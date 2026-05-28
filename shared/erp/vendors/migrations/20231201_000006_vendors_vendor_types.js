// Vendor classification tags (JSON-encoded list stored as TEXT).
module.exports = {
  async up(ctx) {
    await ctx.addColumn('Vendors', 'vendorTypes', { type: ctx.DataTypes.TEXT })
  },
  async down(ctx) {
    await ctx.removeColumn('Vendors', 'vendorTypes')
  },
}
