const navTargets = {
  products_list:  { path: '/erp/item-master',        label: 'Products' },
  product_create: { path: '/erp/item-master/create', label: 'New Product' },
}

const tools = [
  {
    name: 'create_product',
    kind: 'server',
    description: 'Create a new product / item in the catalogue.',
    parameters: {
      type: 'object',
      properties: {
        name:     { type: 'string', description: 'Product name (required).' },
        sku:      { type: 'string', description: 'Stock keeping unit / code. Omit to auto-generate.' },
        cost:     { type: 'number', description: 'Unit cost.' },
        category: { type: 'string', description: 'Category label.' },
      },
      required: ['name'],
    },
    async handler(args, { user }) {
      const productSvc = require('../services/product.service')
      const created = await productSvc.create({
        name: args.name,
        sku: args.sku,
        autoCode: !args.sku,
        cost: args.cost,
        category: args.category,
        userId: user.id,
        organizationId: user.organizationId,
      })
      return {
        result: { id: created.id, name: created.name, sku: created.sku },
        action: { type: 'navigate', target: 'product_edit', path: `/erp/item-master/${created.id}/edit`, label: created.name },
      }
    },
  },

  {
    name: 'list_products',
    kind: 'server',
    description: 'List / search products. Use when the user asks what products exist or to find a product.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional name/SKU/category filter.' },
      },
    },
    async handler(args, { user }) {
      const productSvc = require('../services/product.service')
      const { products, total } = await productSvc.list({
        search: args.search || '',
        limit: 10,
        organizationId: user.organizationId,
      })
      return {
        result: {
          total,
          products: products.map((p) => ({ name: p.name, sku: p.sku, cost: p.cost, status: p.status })),
        },
        action: { type: 'navigate', target: 'products_list', path: '/erp/item-master', label: 'Products' },
      }
    },
  },
]

module.exports = { tools, navTargets }
