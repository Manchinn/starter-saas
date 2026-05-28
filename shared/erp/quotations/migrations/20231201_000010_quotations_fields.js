// Sales-order parity for quotations: header extras + line package/store/tax.
const TEXT  = (ctx) => ({ type: ctx.DataTypes.TEXT })
const MONEY = (ctx) => ({ type: ctx.DataTypes.FLOAT, defaultValue: 0 })

const HEAD = {
  referenceNumber: 'text', paymentTerms: 'text', salespersonId: 'text',
  shippingAddress: 'text', billingAddress: 'text', discountType: 'text',
  discountValue: 'money', discountAmount: 'money', convertedToOrderId: 'text',
}
const ITEM = { salePackageId: 'text', parentItemId: 'text', storeId: 'text', taxRate: 'money', taxAmount: 'money' }

const attr = (ctx, kind) => (kind === 'money' ? MONEY(ctx) : TEXT(ctx))

module.exports = {
  async up(ctx) {
    for (const [col, kind] of Object.entries(HEAD)) await ctx.addColumn('quotations', col, attr(ctx, kind))
    for (const [col, kind] of Object.entries(ITEM)) await ctx.addColumn('quotation_items', col, attr(ctx, kind))
  },
  async down(ctx) {
    for (const col of Object.keys(ITEM).reverse()) await ctx.removeColumn('quotation_items', col)
    for (const col of Object.keys(HEAD).reverse()) await ctx.removeColumn('quotations', col)
  },
}
