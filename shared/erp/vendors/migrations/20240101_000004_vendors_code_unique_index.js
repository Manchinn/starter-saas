// Per-organization uniqueness on Vendors.code. NULL organizationId rows are
// treated as distinct by SQLite (matching the original platform migration).
// addIndex is skipped automatically if the table or a column is absent.
module.exports = {
  async up(ctx) {
    await ctx.addIndex('Vendors', ['code', 'organizationId'], { name: 'idx_vendors_code_org', unique: true })
  },
  async down(ctx) {
    await ctx.removeIndex('Vendors', 'idx_vendors_code_org')
  },
}
