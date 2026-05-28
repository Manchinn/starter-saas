// Demo product categories. Keyed by code for the products seed.
const CATEGORIES = [
  { code: 'ELEC', name: 'Electronics',     description: 'Electronic devices and accessories' },
  { code: 'FURN', name: 'Furniture',       description: 'Office and home furniture' },
  { code: 'STAT', name: 'Stationery',      description: 'Office stationery supplies' },
  { code: 'CHEM', name: 'Chemicals',       description: 'Cleaning and chemical products' },
  { code: 'FOOD', name: 'Food & Beverage', description: 'Consumable food items' },
]

module.exports = {
  name: 'product-categories',
  tier: 'demo',
  order: 130,
  async run(ctx) {
    const { ProductCategory } = ctx.models
    const organizationId = ctx.get('orgId')
    const createdBy = ctx.get('adminId')
    const byCode = {}
    for (const c of CATEGORIES) {
      const [cat] = await ProductCategory.findOrCreate({
        where: { code: c.code, organizationId },
        defaults: { ...c, status: 'active', organizationId, createdBy },
      })
      byCode[c.code] = cat
    }
    ctx.set('categories', byCode)
  },
}
