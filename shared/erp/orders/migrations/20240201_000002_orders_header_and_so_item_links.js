// Sales-order header parity fields + sales-order-item package/parent links.
// (Formerly scripts/add_order_header_fields.js + add_sales_order_item_parent_columns.js.)
const TEXT  = (ctx) => ({ type: ctx.DataTypes.TEXT })
const MONEY = (ctx) => ({ type: ctx.DataTypes.FLOAT, defaultValue: 0 })

const ORDER_HEAD = {
  referenceNumber:     'text',
  expectedDeliveryDate: 'date',
  paymentTerms:        'text',
  salespersonId:       'text',
  shippingAddress:     'text',
  billingAddress:      'text',
  discountType:        'text',
  discountValue:       'money',
  discountAmount:      'money',
}
const SO_ITEM = ['salePackageId', 'parentItemId']

const attr = (ctx, kind) => {
  if (kind === 'money') return MONEY(ctx)
  if (kind === 'date')  return { type: ctx.DataTypes.DATEONLY }
  return TEXT(ctx)
}

module.exports = {
  async up(ctx) {
    for (const [col, kind] of Object.entries(ORDER_HEAD)) await ctx.addColumn('Orders', col, attr(ctx, kind))
    for (const col of SO_ITEM) await ctx.addColumn('sales_order_items', col, TEXT(ctx))
  },
  async down(ctx) {
    for (const col of [...SO_ITEM].reverse()) await ctx.removeColumn('sales_order_items', col)
    for (const col of Object.keys(ORDER_HEAD).reverse()) await ctx.removeColumn('Orders', col)
  },
}
