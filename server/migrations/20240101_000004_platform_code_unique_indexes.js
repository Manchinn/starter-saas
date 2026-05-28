// Per-organization uniqueness on master-data `code`. NULL organizationId rows
// are treated as distinct by SQLite, matching the original raw-SQL behavior.
// addIndex is skipped automatically if the table or a column is absent.
const INDEXES = [
  { name: 'idx_customers_code_org',  table: 'Customers',        fields: ['code', 'organizationId'] },
  { name: 'idx_sale_items_code_org', table: 'sale_items',       fields: ['code', 'organizationId'] },
  { name: 'idx_pricings_code_org',   table: 'Pricings',         fields: ['code', 'organizationId'] },
  { name: 'idx_vendors_code_org',    table: 'Vendors',          fields: ['code', 'organizationId'] },
  { name: 'idx_stores_code_org',     table: 'Stores',           fields: ['code', 'organizationId'] },
  { name: 'idx_categories_code_org', table: 'ProductCategories', fields: ['code', 'organizationId'] },
  { name: 'idx_departments_code_org', table: 'Departments',     fields: ['code', 'organizationId'] },
]

module.exports = {
  async up(ctx) {
    for (const { name, table, fields } of INDEXES) {
      await ctx.addIndex(table, fields, { name, unique: true })
    }
  },
  async down(ctx) {
    for (const { name, table } of INDEXES) await ctx.removeIndex(table, name)
  },
}
