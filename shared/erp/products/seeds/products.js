// Demo products + their store/vendor links. Depends on uoms (110), categories
// (130), stores (120) and vendors (140) from the context.
const PRODUCTS = [
  { name: 'Laptop 15"',           sku: 'ELEC-001', cat: 'ELEC', price: 35000, cost: 28000, stock: 50,  unit: 'pcs', sellUom: 'pcs', buyUom: 'pcs' },
  { name: 'Wireless Mouse',       sku: 'ELEC-002', cat: 'ELEC', price: 890,   cost: 450,   stock: 200, unit: 'pcs', sellUom: 'pcs', buyUom: 'box' },
  { name: 'Mechanical Keyboard',  sku: 'ELEC-003', cat: 'ELEC', price: 2500,  cost: 1600,  stock: 80,  unit: 'pcs', sellUom: 'pcs', buyUom: 'pcs' },
  { name: 'Office Desk 120cm',    sku: 'FURN-001', cat: 'FURN', price: 4500,  cost: 2800,  stock: 30,  unit: 'pcs', sellUom: 'pcs', buyUom: 'pcs' },
  { name: 'Ergonomic Chair',      sku: 'FURN-002', cat: 'FURN', price: 6800,  cost: 4200,  stock: 25,  unit: 'pcs', sellUom: 'pcs', buyUom: 'pcs' },
  { name: 'A4 Paper (500 sheets)', sku: 'STAT-001', cat: 'STAT', price: 120,  cost: 85,    stock: 500, unit: 'pk',  sellUom: 'pk',  buyUom: 'box' },
  { name: 'Ballpoint Pen Set',    sku: 'STAT-002', cat: 'STAT', price: 45,    cost: 22,    stock: 300, unit: 'pk',  sellUom: 'pk',  buyUom: 'box' },
  { name: 'Floor Cleaner 1L',     sku: 'CHEM-001', cat: 'CHEM', price: 85,    cost: 48,    stock: 150, unit: 'L',   sellUom: 'L',   buyUom: 'L' },
  { name: 'Hand Sanitizer 500ml', sku: 'CHEM-002', cat: 'CHEM', price: 65,    cost: 35,    stock: 200, unit: 'pcs', sellUom: 'pcs', buyUom: 'box' },
  { name: 'Instant Coffee 200g',  sku: 'FOOD-001', cat: 'FOOD', price: 180,   cost: 110,   stock: 120, unit: 'kg',  sellUom: 'kg',  buyUom: 'box' },
]

module.exports = {
  name: 'products',
  tier: 'demo',
  order: 150,
  async run(ctx) {
    const { Product, ProductStore, ProductVendor } = ctx.models
    const organizationId = ctx.get('orgId')
    const createdBy = ctx.get('adminId')
    const uoms = ctx.get('uoms')
    const categories = ctx.get('categories')
    const stores = ctx.get('stores')
    const vendors = ctx.get('vendors')

    const rows = []
    for (const p of PRODUCTS) {
      const cat = categories[p.cat]
      const [product] = await Product.findOrCreate({
        where: { sku: p.sku, organizationId },
        defaults: {
          name: p.name, sku: p.sku, category: cat.name,
          price: p.price, cost: p.cost, stock: p.stock, unit: p.unit,
          sellingUomId: uoms[p.sellUom].id, purchasingUomId: uoms[p.buyUom].id,
          status: 'active', organizationId, createdBy,
        },
      })
      rows.push(product)
    }

    // Stock presence: every product in the main warehouse; first 5 also up north.
    const storeLinks = rows.map((p) => ({ productId: p.id, storeId: stores[0].id, organizationId }))
    for (const p of rows.slice(0, 5)) storeLinks.push({ productId: p.id, storeId: stores[1].id, organizationId })
    await ProductStore.bulkCreate(storeLinks, { ignoreDuplicates: true })

    // Vendor sourcing by category band.
    const vendorLinks = []
    for (const p of rows.slice(0, 3)) vendorLinks.push({ productId: p.id, vendorId: vendors[0].id })
    for (const p of rows.slice(3, 7)) vendorLinks.push({ productId: p.id, vendorId: vendors[1].id })
    for (const p of rows.slice(7, 9)) vendorLinks.push({ productId: p.id, vendorId: vendors[2].id })
    for (const p of rows.slice(9))    vendorLinks.push({ productId: p.id, vendorId: vendors[3].id })
    await ProductVendor.bulkCreate(vendorLinks, { ignoreDuplicates: true })

    ctx.set('products', rows)
  },
}
