// AI tools for the product-category controller (mirrors
// controllers/product-category.controller.js + services/product-category.service.js).
//
// Aggregated into ai-tools/index.js. Handlers run server-side with
// ctx = { user: { id, organizationId } } and return { result, action? }.

const navTargets = {
  product_categories_list:  { path: '/erp/product-categories',        label: 'Product Categories' },
  product_category_create:  { path: '/erp/product-categories/create', label: 'New Product Category' },
}

const categorySvc = () => require('../services/product-category.service')

// Map a category name to its id (case-insensitive) for parent assignment.
// Returns null when the name is blank or no active category matches.
async function resolveCategoryId(name, user) {
  const term = (name || '').trim()
  if (!term) return null
  const cats = await categorySvc().listAll(user.organizationId)
  const hit = cats.find((c) => c.name.toLowerCase() === term.toLowerCase())
  return hit ? hit.id : null
}

const tools = [
  {
    name: 'create_product_category',
    kind: 'server',
    permissions: ['erp.products.edit'],
    description: 'Create a new product category. The code is auto-generated.',
    parameters: {
      type: 'object',
      properties: {
        name:        { type: 'string', description: 'Category name (required).' },
        description: { type: 'string' },
        parent:      { type: 'string', description: 'Parent category name (optional, one level deep).' },
      },
      required: ['name'],
    },
    async handler(args, { user }) {
      const parentId = await resolveCategoryId(args.parent, user)
      const created = await categorySvc().create({
        name: args.name,
        autoCode: true,
        description: args.description,
        parentId,
        userId: user.id,
        organizationId: user.organizationId,
      })
      return {
        result: { id: created.id, name: created.name, code: created.code },
        action: { type: 'navigate', target: 'product_category_edit', path: `/erp/product-categories/${created.id}/edit`, label: created.name },
      }
    },
  },

  {
    name: 'list_product_categories',
    kind: 'server',
    permissions: ['erp.products.list'],
    description: 'List or search product categories.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional name filter.' },
      },
    },
    async handler(args, { user }) {
      const { categories, total } = await categorySvc().list({
        search: args.search || '',
        limit: 20,
        organizationId: user.organizationId,
      })
      return {
        result: {
          total,
          categories: categories.map((c) => ({ id: c.id, name: c.name, code: c.code, parent: c.parent?.name || null, status: c.status })),
        },
        action: { type: 'navigate', target: 'product_categories_list', path: '/erp/product-categories', label: 'Product Categories' },
      }
    },
  },
]

module.exports = { tools, navTargets, resolveCategoryId }
