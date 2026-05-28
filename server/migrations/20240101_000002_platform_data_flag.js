// Platform-wide soft-delete flag: dataFlag (0=inactive, 1=active, 2=deleted).
const TABLES = [
  'Customers', 'CustomerGroups',
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
  'Vendors', 'Stores', 'UOMs', 'UOMConversions',
  'Products', 'ProductCategories', 'sale_items', 'Pricings',
  'Employees', 'Departments',
  'StockMovements', 'Items',
]

module.exports = {
  async up(ctx) {
    const attr = { type: ctx.DataTypes.INTEGER, defaultValue: 1 }
    for (const table of TABLES) await ctx.addColumn(table, 'dataFlag', attr)
  },
  async down(ctx) {
    for (const table of TABLES) await ctx.removeColumn(table, 'dataFlag')
  },
}
