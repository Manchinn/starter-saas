// Platform-wide audit columns: createdBy / modifiedBy on every main entity.
// Cross-cutting — spans many modules — so it lives in the core platform set.
const TABLES = [
  'Customers', 'CustomerGroups',
  'quotations', 'quotation_items',
  'Orders', 'sales_order_items',
  'Invoices', 'invoice_items',
  'Receipts',
  'GoodReceives',
  'StockAdjusts', 'StockCounts', 'StockIssues', 'StockRequests', 'StockReturns',
  'MasterDataCategories', 'MasterDataValues',
  'Vendors', 'Stores', 'UOMs', 'UOMConversions',
  'Products', 'ProductCategories', 'sale_items', 'Pricings',
  'Employees', 'Departments',
]

module.exports = {
  async up(ctx) {
    const attr = { type: ctx.DataTypes.TEXT }
    for (const table of TABLES) {
      await ctx.addColumn(table, 'createdBy', attr)
      await ctx.addColumn(table, 'modifiedBy', attr)
    }
  },
  async down(ctx) {
    for (const table of TABLES) {
      await ctx.removeColumn(table, 'modifiedBy')
      await ctx.removeColumn(table, 'createdBy')
    }
  },
}
