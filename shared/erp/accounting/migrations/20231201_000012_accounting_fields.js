// Auto-journal source back-reference + multi-currency on receive payments.
module.exports = {
  async up(ctx) {
    await ctx.addColumn('Journals', 'sourceType', { type: ctx.DataTypes.TEXT })
    await ctx.addColumn('Journals', 'sourceId', { type: ctx.DataTypes.TEXT })
    await ctx.addColumn('ReceivePayments', 'currency', { type: ctx.DataTypes.TEXT })
    await ctx.addColumn('ReceivePayments', 'exchangeRate', { type: ctx.DataTypes.FLOAT, defaultValue: 1 })
  },
  async down(ctx) {
    await ctx.removeColumn('ReceivePayments', 'exchangeRate')
    await ctx.removeColumn('ReceivePayments', 'currency')
    await ctx.removeColumn('Journals', 'sourceId')
    await ctx.removeColumn('Journals', 'sourceType')
  },
}
