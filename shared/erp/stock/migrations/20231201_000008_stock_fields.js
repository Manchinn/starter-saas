// Good-receive line/header extensions, GR→PO link, and batch/expiry tracking
// on outbound stock lines (issues + returns).
const TEXT  = (ctx) => ({ type: ctx.DataTypes.TEXT })
const MONEY = (ctx) => ({ type: ctx.DataTypes.FLOAT, defaultValue: 0 })

const GR_ITEM = {
  qtyUomId: 'text', freeQty: 'money', freeQtyUomId: 'text', batchId: 'text',
  expiryDate: 'text', discount: 'money', discountPct: 'money', netAmount: 'money',
  wac: 'money', comments: 'text', stockQty: 'money',
}
const GR_HEAD = {
  docType: 'docType', invoiceNo: 'text', invoiceDate: 'text', deliveryNo: 'text',
  invoiceDiscount: 'money', invoiceNetAmount: 'money', purchaseOrderId: 'text',
}

const attr = (ctx, kind) => {
  if (kind === 'money') return MONEY(ctx)
  if (kind === 'docType') return { type: ctx.DataTypes.TEXT, defaultValue: 'invoice' }
  return TEXT(ctx)
}

module.exports = {
  async up(ctx) {
    for (const [col, kind] of Object.entries(GR_ITEM)) await ctx.addColumn('GoodReceiveItems', col, attr(ctx, kind))
    for (const [col, kind] of Object.entries(GR_HEAD)) await ctx.addColumn('GoodReceives', col, attr(ctx, kind))
    for (const table of ['StockIssueItems', 'StockReturnItems']) {
      await ctx.addColumn(table, 'batchId', TEXT(ctx))
      await ctx.addColumn(table, 'expiryDate', TEXT(ctx))
    }
  },
  async down(ctx) {
    for (const table of ['StockIssueItems', 'StockReturnItems']) {
      await ctx.removeColumn(table, 'expiryDate')
      await ctx.removeColumn(table, 'batchId')
    }
    for (const col of Object.keys(GR_HEAD).reverse()) await ctx.removeColumn('GoodReceives', col)
    for (const col of Object.keys(GR_ITEM).reverse()) await ctx.removeColumn('GoodReceiveItems', col)
  },
}
