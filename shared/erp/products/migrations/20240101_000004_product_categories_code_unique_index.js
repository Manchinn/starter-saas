// Per-organization uniqueness on ProductCategories.code. NULL organizationId
// rows are treated as distinct by SQLite (matching the original platform
// migration). addIndex is skipped automatically if the table or column is absent.
module.exports = {
  async up(ctx) {
    await ctx.addIndex('ProductCategories', ['code', 'organizationId'], { name: 'idx_categories_code_org', unique: true })
  },
  async down(ctx) {
    await ctx.removeIndex('ProductCategories', 'idx_categories_code_org')
  },
}
