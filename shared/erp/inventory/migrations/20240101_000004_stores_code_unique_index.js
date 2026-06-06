// Per-organization uniqueness on Stores.code. NULL organizationId rows are
// treated as distinct by SQLite (matching the original platform migration).
// addIndex is skipped automatically if the table or a column is absent.
module.exports = {
  async up(ctx) {
    await ctx.addIndex('Stores', ['code', 'organizationId'], { name: 'idx_stores_code_org', unique: true })
  },
  async down(ctx) {
    await ctx.removeIndex('Stores', 'idx_stores_code_org')
  },
}
