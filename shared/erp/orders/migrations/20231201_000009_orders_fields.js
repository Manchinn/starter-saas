// Sales-order line provenance/tax, delivery-order header parity fields, and a
// one-time backfill of the legacy `address` column into `shippingAddress`.
const TEXT  = (ctx) => ({ type: ctx.DataTypes.TEXT })
const MONEY = (ctx) => ({ type: ctx.DataTypes.FLOAT, defaultValue: 0 })

const SO_ITEM = { saleItemId: 'text', storeId: 'text', taxRate: 'money', taxAmount: 'money' }
const DO_HEAD = ['referenceNumber', 'paymentTerms', 'salespersonId', 'shippingAddress', 'billingAddress']
const DO_ITEM = ['saleItemId', 'salePackageId', 'storeId']

module.exports = {
  async up(ctx) {
    for (const [col, kind] of Object.entries(SO_ITEM)) {
      await ctx.addColumn('sales_order_items', col, kind === 'money' ? MONEY(ctx) : TEXT(ctx))
    }
    for (const col of DO_HEAD) await ctx.addColumn('DeliveryOrders', col, TEXT(ctx))
    for (const col of DO_ITEM) await ctx.addColumn('DeliveryOrderItems', col, TEXT(ctx))

    // Backfill: copy legacy single-address into shippingAddress where unset.
    if (await ctx.columnExists('DeliveryOrders', 'address')) {
      await ctx.rawSafe('UPDATE "DeliveryOrders" SET "shippingAddress" = address WHERE "shippingAddress" IS NULL AND address IS NOT NULL')
    }
  },
  async down(ctx) {
    for (const col of [...DO_ITEM].reverse()) await ctx.removeColumn('DeliveryOrderItems', col)
    for (const col of [...DO_HEAD].reverse()) await ctx.removeColumn('DeliveryOrders', col)
    for (const col of Object.keys(SO_ITEM).reverse()) await ctx.removeColumn('sales_order_items', col)
  },
}
