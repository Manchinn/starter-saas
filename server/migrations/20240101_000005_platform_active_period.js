// Validity window (activeFrom / activeTo) on master-data tables.
const TABLES = [
  'Customers', 'CustomerGroups',
  'Vendors', 'Stores', 'UOMs',
  'Products', 'ProductCategories', 'Pricings',
  'Departments', 'Employees',
]

module.exports = {
  async up(ctx) {
    const attr = { type: ctx.DataTypes.TEXT }
    for (const table of TABLES) {
      await ctx.addColumn(table, 'activeFrom', attr)
      await ctx.addColumn(table, 'activeTo', attr)
    }
  },
  async down(ctx) {
    for (const table of TABLES) {
      await ctx.removeColumn(table, 'activeTo')
      await ctx.removeColumn(table, 'activeFrom')
    }
  },
}
