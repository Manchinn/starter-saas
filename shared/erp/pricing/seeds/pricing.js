// Demo price lists: a retail and a wholesale (10% off) price per sale item.
// Depends on sale-items (180), products (150) and customer-groups (160).
module.exports = {
  name: 'pricing',
  tier: 'demo',
  order: 190,
  async run(ctx) {
    const { Pricing } = ctx.models
    const organizationId = ctx.get('orgId')
    const createdBy = ctx.get('adminId')
    const saleItems = ctx.get('saleItems')
    const products = ctx.get('products')
    const groups = ctx.get('customerGroups')

    for (const [i, saleItem] of saleItems.entries()) {
      const product = products[i]
      const seq = String(i + 1).padStart(3, '0')
      const lines = [
        { code: `PRC-R${seq}`, name: `${product.name} - Retail`,    unitPrice: product.price,                  groupIdx: 0 },
        { code: `PRC-W${seq}`, name: `${product.name} - Wholesale`, unitPrice: Math.round(product.price * 0.9), groupIdx: 1 },
      ]
      for (const l of lines) {
        await Pricing.findOrCreate({
          where: { code: l.code, organizationId },
          defaults: {
            code: l.code, name: l.name, unitPrice: l.unitPrice,
            saleItemId: saleItem.id, customerGroupId: groups[l.groupIdx].id,
            status: 'active', organizationId, createdBy,
          },
        })
      }
    }
  },
}
