// Demo sale items — one per product, in the same order as the products seed.
module.exports = {
  name: 'sale-items',
  tier: 'demo',
  order: 180,
  async run(ctx) {
    const { SaleItem } = ctx.models
    const organizationId = ctx.get('orgId')
    const createdBy = ctx.get('adminId')
    const products = ctx.get('products')

    const rows = []
    for (const [i, product] of products.entries()) {
      const code = `SI-${String(i + 1).padStart(3, '0')}`
      const [saleItem] = await SaleItem.findOrCreate({
        where: { code, organizationId },
        defaults: { code, name: product.name, productId: product.id, status: 'active', organizationId, createdBy },
      })
      rows.push(saleItem)
    }
    ctx.set('saleItems', rows)
  },
}
