// Session tracking metadata on refresh tokens (device / IP / last-used).
const COLUMNS = ['userAgent', 'ip', 'deviceLabel']

module.exports = {
  async up(ctx) {
    for (const col of COLUMNS) await ctx.addColumn('RefreshTokens', col, { type: ctx.DataTypes.TEXT })
    await ctx.addColumn('RefreshTokens', 'lastUsedAt', { type: ctx.DataTypes.DATE })
  },
  async down(ctx) {
    await ctx.removeColumn('RefreshTokens', 'lastUsedAt')
    for (const col of COLUMNS) await ctx.removeColumn('RefreshTokens', col)
  },
}
