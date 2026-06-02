// AI tools for the sale-item controller (mirrors
// controllers/sale-item.controller.js + services/sale-item.service.js).
//
// Sale items are catalog master data (optionally linked to a product), so they
// get full CRUD. `resolveSaleItem` is exported so the sale-package tools can
// turn an item name/code into its id. The optional product link reuses the
// products tools' resolveProduct.

const { resolveProduct } = require('../../products/ai-tools/product.ai-tools')

const navTargets = {
  sale_items_list:  { path: '/erp/sale-items',        label: 'Sale Items' },
  sale_item_create: { path: '/erp/sale-items/create', label: 'New Sale Item' },
}

const saleItemSvc = () => require('../services/sale-item.service')
const orgOf = (user) => user?.organizationId || user?.id || null

const STATUSES = ['active', 'inactive']

const slim = (i) => ({
  id:      i.id,
  name:    i.name,
  code:    i.code,
  status:  i.status,
  product: i.product?.name || null,
})

// Resolve a free-text term (name / code) to one sale item.
async function resolveSaleItem(search, user) {
  const term = (search || '').trim()
  if (!term) return { error: 'Provide a sale item name or code to identify it.' }

  const { items } = await saleItemSvc().list({ search: term, limit: 10, organizationId: orgOf(user) })
  if (!items.length) return { error: `No sale item matches "${term}".` }
  if (items.length === 1) return { item: items[0] }

  const lc = term.toLowerCase()
  const exact = items.filter((i) => [i.name, i.code].some((v) => v && String(v).toLowerCase() === lc))
  if (exact.length === 1) return { item: exact[0] }

  const names = items.map((i) => `${i.name}${i.code ? ` (${i.code})` : ''}`).join(', ')
  return { error: `Multiple sale items match "${term}": ${names}. Be more specific (use the code or full name).` }
}

const tools = [
  {
    name: 'create_sale_item',
    kind: 'server',
    description: 'Create a sale item (a sellable catalog entry). If no code is given, one is auto-generated. '
      + 'Optionally link it to a product.',
    parameters: {
      type: 'object',
      properties: {
        name:    { type: 'string', description: 'Sale item name (required).' },
        code:    { type: 'string', description: 'Optional code; auto-generated when omitted.' },
        product: { type: 'string', description: 'Optional product name/SKU to link.' },
        status:  { type: 'string', enum: STATUSES, description: 'Default active.' },
      },
      required: ['name'],
    },
    async handler(args, { user }) {
      let productId = null
      if (args.product) {
        const { product, error } = await resolveProduct(args.product, user)
        if (error) return { result: error }
        productId = product.id
      }
      const created = await saleItemSvc().create({
        name:     args.name,
        code:     args.code,
        autoCode: !args.code,
        productId,
        status:   args.status || 'active',
        userId:   user.id,
        organizationId: orgOf(user),
      })
      return {
        result: { id: created.id, name: created.name, code: created.code },
        action: { type: 'navigate', target: 'sale_item_edit', path: `/erp/sale-items/${created.id}/edit`, label: created.name },
      }
    },
  },

  {
    name: 'list_sale_items',
    kind: 'server',
    description: 'List or search sale items. Use when the user asks what sale items exist.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional name/code filter.' },
        status: { type: 'string', enum: STATUSES, description: 'Optional status filter.' },
        limit:  { type: 'number', description: 'Max rows to return (default 10).' },
      },
    },
    async handler(args, { user }) {
      const { total, items } = await saleItemSvc().list({
        search: args.search || '',
        status: args.status || '',
        limit:  Math.min(Math.max(Number(args.limit) || 10, 1), 50),
        organizationId: orgOf(user),
      })
      return {
        result: { total, items: items.map(slim) },
        action: { type: 'navigate', target: 'sale_items_list', path: '/erp/sale-items', label: 'Sale Items' },
      }
    },
  },

  {
    name: 'get_sale_item',
    kind: 'server',
    description: 'Look up a single sale item (incl. its price list entries) by name or code.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Name or code identifying the sale item.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { item, error } = await resolveSaleItem(args.search, user)
      if (error) return { result: error }
      const full = await saleItemSvc().getById(item.id, orgOf(user))
      const pricings = (full.pricings || []).map((p) => ({ name: p.name, unitPrice: Number(p.unitPrice), currency: p.currency }))
      return {
        result: { ...slim(full), pricings },
        action: { type: 'navigate', target: 'sale_item_edit', path: `/erp/sale-items/${full.id}/edit`, label: full.name },
      }
    },
  },

  {
    name: 'update_sale_item',
    kind: 'server',
    description: 'Update a sale item. Identify it with `search`; only the fields you pass are changed. '
      + 'Pass an empty product to unlink it.',
    parameters: {
      type: 'object',
      properties: {
        search:  { type: 'string', description: 'Name or code identifying the sale item to update.' },
        name:    { type: 'string' },
        code:    { type: 'string' },
        product: { type: 'string', description: 'Product name/SKU to link, or empty string to unlink.' },
        status:  { type: 'string', enum: STATUSES },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { item, error } = await resolveSaleItem(args.search, user)
      if (error) return { result: error }

      const patch = {}
      for (const f of ['name', 'code', 'status']) {
        if (args[f] !== undefined) patch[f] = args[f]
      }
      if (args.product !== undefined) {
        if (!args.product) {
          patch.productId = null
        } else {
          const { product, error: pErr } = await resolveProduct(args.product, user)
          if (pErr) return { result: pErr }
          patch.productId = product.id
        }
      }
      if (!Object.keys(patch).length) return { result: 'Nothing to update — pass at least one field to change.' }

      const updated = await saleItemSvc().update(item.id, patch, user.id, orgOf(user))
      return {
        result: { id: updated.id, name: updated.name, code: updated.code, updated: Object.keys(patch) },
        action: { type: 'navigate', target: 'sale_item_edit', path: `/erp/sale-items/${updated.id}/edit`, label: updated.name },
      }
    },
  },

  {
    name: 'delete_sale_item',
    kind: 'server',
    description: 'Delete a sale item. Identify it with `search`.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Name or code identifying the sale item to delete.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { item, error } = await resolveSaleItem(args.search, user)
      if (error) return { result: error }
      const { id, name, code } = item
      await saleItemSvc().remove(id, orgOf(user))
      return {
        result: `Deleted sale item ${name}${code ? ` (${code})` : ''}.`,
        action: { type: 'navigate', target: 'sale_items_list', path: '/erp/sale-items', label: 'Sale Items' },
      }
    },
  },
]

module.exports = { tools, navTargets, resolveSaleItem, slim }
