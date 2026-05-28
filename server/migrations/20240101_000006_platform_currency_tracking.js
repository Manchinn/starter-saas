// Multi-currency tracking (currency + exchangeRate) on transactional documents.
const TABLES = [
  'quotations', 'Orders', 'Invoices', 'Receipts',
  'PurchaseRequisitions', 'PurchaseOrders', 'vendor_bills', 'BillingNotes',
]

module.exports = {
  async up(ctx) {
    for (const table of TABLES) {
      await ctx.addColumn(table, 'currency', { type: ctx.DataTypes.TEXT })
      await ctx.addColumn(table, 'exchangeRate', { type: ctx.DataTypes.FLOAT, defaultValue: 1 })
    }
  },
  async down(ctx) {
    for (const table of TABLES) {
      await ctx.removeColumn(table, 'exchangeRate')
      await ctx.removeColumn(table, 'currency')
    }
  },
}
