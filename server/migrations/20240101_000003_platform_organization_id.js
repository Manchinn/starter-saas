// Platform-wide tenancy column: organizationId on every ERP entity table.
// Must run before the per-org unique code indexes (next core migration).
const TABLES = [
  'Customers', 'CustomerGroups',
  'sale_items', 'Pricings',
  'Vendors', 'Stores', 'ProductCategories', 'Products',
  'UOMs', 'UOMConversions',
  'quotations', 'quotation_items',
  'Orders', 'sales_order_items',
  'Invoices', 'invoice_items',
  'Receipts',
  'GoodReceives', 'GoodReceiveItems',
  'StockAdjusts', 'StockAdjustItems',
  'StockCounts', 'StockCountItems',
  'StockIssues', 'StockIssueItems',
  'StockRequests', 'StockRequestItems',
  'StockReturns', 'StockReturnItems',
  'MasterDataCategories', 'MasterDataValues',
  'StockMovements', 'Items',
]

module.exports = {
  async up(ctx) {
    const attr = { type: ctx.DataTypes.TEXT }
    for (const table of TABLES) await ctx.addColumn(table, 'organizationId', attr)
  },
  async down(ctx) {
    for (const table of TABLES) await ctx.removeColumn(table, 'organizationId')
  },
}
