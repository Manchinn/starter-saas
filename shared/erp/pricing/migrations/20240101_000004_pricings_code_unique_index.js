// Per-organization uniqueness on Pricings.code. NULL organizationId rows are
// treated as distinct by SQLite (matching the original platform migration).
// addIndex is skipped automatically if the table or a column is absent.
module.exports = {
  async up(ctx) {
    await ctx.addIndex('Pricings', ['code', 'organizationId'], { name: 'idx_pricings_code_org', unique: true })
  },
  async down(ctx) {
    await ctx.removeIndex('Pricings', 'idx_pricings_code_org')
  },
}
