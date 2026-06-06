// Per-organization uniqueness on Departments.code. NULL organizationId rows are
// treated as distinct by SQLite (matching the original platform migration).
// addIndex is skipped automatically if the table or a column is absent.
module.exports = {
  async up(ctx) {
    await ctx.addIndex('Departments', ['code', 'organizationId'], { name: 'idx_departments_code_org', unique: true })
  },
  async down(ctx) {
    await ctx.removeIndex('Departments', 'idx_departments_code_org')
  },
}
