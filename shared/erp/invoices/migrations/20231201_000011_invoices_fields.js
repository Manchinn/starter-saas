// Invoice header parity + DO link + partial-payment tracking, invoice-line
// provenance/tax, and a frozen itemCode snapshot (with legacy backfills).
const TEXT  = (ctx) => ({ type: ctx.DataTypes.TEXT })
const MONEY = (ctx) => ({ type: ctx.DataTypes.FLOAT, defaultValue: 0 })

const HEAD = {
  deliveryOrderId: 'text', referenceNumber: 'text', paymentTerms: 'text',
  salespersonId: 'text', shippingAddress: 'text', billingAddress: 'text',
  discountType: 'text', discountValue: 'money', discountAmount: 'money', amountPaid: 'money',
}
const ITEM = {
  saleItemId: 'text', salePackageId: 'text', parentItemId: 'text', productId: 'text',
  storeId: 'text', taxRate: 'money', taxAmount: 'money', itemCode: 'text',
}

const attr = (ctx, kind) => (kind === 'money' ? MONEY(ctx) : TEXT(ctx))

module.exports = {
  async up(ctx) {
    for (const [col, kind] of Object.entries(HEAD)) await ctx.addColumn('Invoices', col, attr(ctx, kind))
    for (const [col, kind] of Object.entries(ITEM)) await ctx.addColumn('invoice_items', col, attr(ctx, kind))

    // Invoices already marked paid get amountPaid = total.
    await ctx.rawSafe(`UPDATE "Invoices" SET "amountPaid" = total WHERE status = 'paid' AND ("amountPaid" IS NULL OR "amountPaid" = 0)`)

    // Freeze itemCode from the source record (sale item → package → product sku).
    await ctx.rawSafe(`UPDATE invoice_items SET "itemCode" = (SELECT code FROM sale_items WHERE sale_items.id = invoice_items."saleItemId") WHERE "itemCode" IS NULL AND "saleItemId" IS NOT NULL`)
    await ctx.rawSafe(`UPDATE invoice_items SET "itemCode" = (SELECT code FROM sale_packages WHERE sale_packages.id = invoice_items."salePackageId") WHERE "itemCode" IS NULL AND "salePackageId" IS NOT NULL`)
    await ctx.rawSafe(`UPDATE invoice_items SET "itemCode" = (SELECT sku FROM "Products" WHERE "Products".id = invoice_items."productId") WHERE "itemCode" IS NULL AND "productId" IS NOT NULL`)
    // Legacy seed rows carry only productName — match by name within the org.
    await ctx.rawSafe(`UPDATE invoice_items SET "itemCode" = (SELECT code FROM sale_items WHERE sale_items.name = invoice_items."productName" AND sale_items."organizationId" IS NOT DISTINCT FROM invoice_items."organizationId" LIMIT 1) WHERE "itemCode" IS NULL AND "saleItemId" IS NULL AND "salePackageId" IS NULL AND "productId" IS NULL`)
  },
  async down(ctx) {
    for (const col of Object.keys(ITEM).reverse()) await ctx.removeColumn('invoice_items', col)
    for (const col of Object.keys(HEAD).reverse()) await ctx.removeColumn('Invoices', col)
  },
}
