// AI tools for the product controller (mirrors
// controllers/product.controller.js + services/product.service.js).
//
// Aggregated into ai-tools/index.js. Handlers run server-side with
// ctx = { user: { id, organizationId } } and return { result, action? }.
//
// The LLM works with names, not UUIDs, so get/update/delete first resolve a
// free-text term to exactly one product before acting.

const navTargets = {
  products_list:  { path: '/erp/item-master',        label: 'Products' },
  product_create: { path: '/erp/item-master/create', label: 'New Product' },
}

const productSvc = () => require('../services/product.service')

// Shape a product row into a compact, model-friendly object.
const slim = (p) => ({
  id:       p.id,
  name:     p.name,
  sku:      p.sku,
  cost:     p.cost,
  category: p.category,
  status:   p.status,
  stock:    p.stock,
})

// Resolve a free-text term (name / sku / category) to one product.
// Returns { product } on a unique hit, or { error } describing why not.
async function resolveProduct(search, user) {
  const term = (search || '').trim()
  if (!term) return { error: 'Provide a product name, SKU, or category to identify the product.' }

  const { products } = await productSvc().list({ search: term, limit: 10, organizationId: user.organizationId })
  if (!products.length) return { error: `No product matches "${term}".` }
  if (products.length === 1) return { product: products[0] }

  // Disambiguate an over-broad term by an exact (case-insensitive) match.
  const lc = term.toLowerCase()
  const exact = products.filter((p) => [p.name, p.sku].some((v) => v && String(v).toLowerCase() === lc))
  if (exact.length === 1) return { product: exact[0] }

  const names = products.map((p) => `${p.name}${p.sku ? ` (${p.sku})` : ''}`).join(', ')
  return { error: `Multiple products match "${term}": ${names}. Be more specific (use the SKU or full name).` }
}

const tools = [
  {
    name: 'create_product',
    kind: 'server',
    permissions: ['erp.products.edit'],
    description: 'Create a new product / item in the catalogue.',
    parameters: {
      type: 'object',
      properties: {
        name:         { type: 'string', description: 'Product name (required).' },
        sku:          { type: 'string', description: 'Stock keeping unit / code. Omit to auto-generate.' },
        cost:         { type: 'number', description: 'Unit cost.' },
        category:     { type: 'string', description: 'Category label.' },
        description:  { type: 'string' },
        status:       { type: 'string', enum: ['active', 'inactive'] },
        reorderPoint: { type: 'number', description: 'Stock level that triggers a reorder.' },
        reorderQty:   { type: 'number', description: 'Quantity to reorder.' },
      },
      required: ['name'],
    },
    async handler(args, { user }) {
      const created = await productSvc().create({
        name: args.name,
        sku: args.sku,
        autoCode: !args.sku,
        cost: args.cost,
        category: args.category,
        description: args.description,
        status: args.status,
        reorderPoint: args.reorderPoint,
        reorderQty: args.reorderQty,
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
    permissions: ['erp.products.list'],
    description: 'List or search products. Use when the user asks what products exist or to find a product.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional name/SKU/category filter.' },
        status: { type: 'string', enum: ['active', 'inactive'], description: 'Optional status filter.' },
        limit:  { type: 'number', description: 'Max rows to return (default 10).' },
      },
    },
    async handler(args, { user }) {
      const { products, total } = await productSvc().list({
        search: args.search || '',
        status: args.status || '',
        limit: Math.min(Math.max(Number(args.limit) || 10, 1), 50),
        organizationId: user.organizationId,
      })
      return {
        result: { total, products: products.map(slim) },
        action: { type: 'navigate', target: 'products_list', path: '/erp/item-master', label: 'Products' },
      }
    },
  },

  {
    name: 'get_product',
    kind: 'server',
    permissions: ['erp.products.list'],
    description: 'Look up a single product\'s full details by name, SKU, or category.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Name, SKU, or category to identify the product.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { product, error } = await resolveProduct(args.search, user)
      if (error) return { result: error }
      return {
        result: {
          ...slim(product),
          description:  product.description || null,
          reorderPoint: product.reorderPoint,
          reorderQty:   product.reorderQty,
        },
        action: { type: 'navigate', target: 'product_edit', path: `/erp/item-master/${product.id}/edit`, label: product.name },
      }
    },
  },

  {
    name: 'update_product',
    kind: 'server',
    permissions: ['erp.products.edit'],
    description: 'Update an existing product. Identify it with `search`; only the fields you pass are changed.',
    parameters: {
      type: 'object',
      properties: {
        search:       { type: 'string', description: 'Name, SKU, or category identifying the product to update.' },
        name:         { type: 'string' },
        sku:          { type: 'string' },
        cost:         { type: 'number' },
        category:     { type: 'string' },
        description:  { type: 'string' },
        status:       { type: 'string', enum: ['active', 'inactive'] },
        reorderPoint: { type: 'number' },
        reorderQty:   { type: 'number' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { product, error } = await resolveProduct(args.search, user)
      if (error) return { result: error }

      const patch = {}
      for (const f of ['name', 'sku', 'cost', 'category', 'description', 'status', 'reorderPoint', 'reorderQty']) {
        if (args[f] !== undefined) patch[f] = args[f]
      }
      if (!Object.keys(patch).length) return { result: 'Nothing to update — pass at least one field to change.' }

      const updated = await productSvc().update(product.id, patch, user.id, user.organizationId)
      return {
        result: { id: updated.id, name: updated.name, sku: updated.sku, updated: Object.keys(patch) },
        action: { type: 'navigate', target: 'product_edit', path: `/erp/item-master/${updated.id}/edit`, label: updated.name },
      }
    },
  },

  {
    name: 'delete_product',
    kind: 'server',
    permissions: ['erp.products.delete'],
    description: 'Delete a product. Identify it with `search`. Fails if the product still has stock on hand.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Name, SKU, or category identifying the product to delete.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { product, error } = await resolveProduct(args.search, user)
      if (error) return { result: error }
      const { id, name, sku } = product
      await productSvc().remove(id, user.organizationId)
      return {
        result: `Deleted product ${name}${sku ? ` (${sku})` : ''}.`,
        action: { type: 'navigate', target: 'products_list', path: '/erp/item-master', label: 'Products' },
      }
    },
  },
]

module.exports = { tools, navTargets, resolveProduct, slim }
