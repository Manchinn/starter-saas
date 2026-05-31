// TFRS for NPAEs: statement line-item classification on the chart of accounts.
module.exports = {
  async up(ctx) {
    await ctx.addColumn('ChartOfAccounts', 'statementCategory', { type: ctx.DataTypes.TEXT })
  },
  async down(ctx) {
    await ctx.removeColumn('ChartOfAccounts', 'statementCategory')
  },
}
