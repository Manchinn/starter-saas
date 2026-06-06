// Per-organization uniqueness on Customers.code. NULL organizationId rows are
// treated as distinct by SQLite (matching the original platform migration).
// addIndex is skipped automatically if the table or a column is absent.
module.exports = {
  async up(ctx) {
    await ctx.addIndex('Customers', ['code', 'organizationId'], { name: 'idx_customers_code_org', unique: true })
  },
  async down(ctx) {
    await ctx.removeIndex('Customers', 'idx_customers_code_org')
  },
}
