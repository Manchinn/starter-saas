// Per-organization uniqueness on sale_items.code. NULL organizationId rows are
// treated as distinct by SQLite (matching the original platform migration).
// addIndex is skipped automatically if the table or a column is absent.
module.exports = {
  async up(ctx) {
    await ctx.addIndex('sale_items', ['code', 'organizationId'], { name: 'idx_sale_items_code_org', unique: true })
  },
  async down(ctx) {
    await ctx.removeIndex('sale_items', 'idx_sale_items_code_org')
  },
}
