// AI tools for the sale-package controller (mirrors
// controllers/sale-package.controller.js + services/sale-package.service.js).
//
// A sale package bundles sale items (each with a quantity). The bundle has no
// financial workflow, so it gets full CRUD; each line's sale item is resolved
// from free text via the sale-item tools' resolveSaleItem.

const { resolveSaleItem } = require('./sale-item.ai-tools')

const navTargets = {
  sale_packages_list:  { path: '/erp/sale-packages',        label: 'Sale Packages' },
  sale_package_create: { path: '/erp/sale-packages/create', label: 'New Sale Package' },
}

const pkgSvc = () => require('../services/sale-package.service')
const orgOf = (user) => user?.organizationId || user?.id || null

const STATUSES = ['active', 'inactive']

const slim = (p) => ({
  id:        p.id,
  name:      p.name,
  code:      p.code,
  status:    p.status,
  itemCount: (p.packageItems || []).length,
})

// Resolve a free-text term (name / code) to one sale package.
async function resolvePackage(search, user) {
  const term = (search || '').trim()
  if (!term) return { error: 'Provide a package name or code to identify it.' }

  const { items } = await pkgSvc().list({ search: term, limit: 10, organizationId: orgOf(user) })
  if (!items.length) return { error: `No sale package matches "${term}".` }
  if (items.length === 1) return { pkg: items[0] }

  const lc = term.toLowerCase()
  const exact = items.filter((p) => [p.name, p.code].some((v) => v && String(v).toLowerCase() === lc))
  if (exact.length === 1) return { pkg: exact[0] }

  const names = items.map((p) => `${p.name}${p.code ? ` (${p.code})` : ''}`).join(', ')
  return { error: `Multiple sale packages match "${term}": ${names}. Be more specific (use the code or full name).` }
}

// Turn an array of { saleItem, quantity, unitPrice } into the service's
// { saleItemId, quantity, unitPrice } line shape, resolving each item by name.
async function resolvePackageItems(items, user) {
  const lines = []
  for (const raw of items) {
    const { item, error } = await resolveSaleItem(raw.saleItem, user)
    if (error) return { error }
    lines.push({
      saleItemId: item.id,
      quantity:   Number(raw.quantity) || 1,
      unitPrice:  raw.unitPrice != null ? Number(raw.unitPrice) : null,
    })
  }
  return { lines }
}

const itemsSchema = {
  type: 'array',
  description: 'Bundle lines. Each references a sale item by name/code with a quantity.',
  items: {
    type: 'object',
    properties: {
      saleItem:  { type: 'string', description: 'Sale item name or code (required).' },
      quantity:  { type: 'number', description: 'Quantity (default 1).' },
      unitPrice: { type: 'number', description: 'Optional override unit price.' },
    },
    required: ['saleItem'],
  },
}

const tools = [
  {
    name: 'create_sale_package',
    kind: 'server',
    description: 'Create a sale package (a bundle of sale items). If no code is given, one is auto-generated.',
    parameters: {
      type: 'object',
      properties: {
        name:        { type: 'string', description: 'Package name (required).' },
        code:        { type: 'string', description: 'Optional code; auto-generated when omitted.' },
        description: { type: 'string' },
        status:      { type: 'string', enum: STATUSES, description: 'Default active.' },
        items:       itemsSchema,
      },
      required: ['name'],
    },
    async handler(args, { user }) {
      let lines = []
      if (Array.isArray(args.items) && args.items.length) {
        const resolved = await resolvePackageItems(args.items, user)
        if (resolved.error) return { result: resolved.error }
        lines = resolved.lines
      }
      const created = await pkgSvc().create({
        name:        args.name,
        code:        args.code,
        autoCode:    !args.code,
        description: args.description,
        status:      args.status || 'active',
        items:       lines,
        userId:      user.id,
        organizationId: orgOf(user),
      })
      return {
        result: { id: created.id, name: created.name, code: created.code, itemCount: (created.packageItems || []).length },
        action: { type: 'navigate', target: 'sale_package_edit', path: `/erp/sale-packages/${created.id}/edit`, label: created.name },
      }
    },
  },

  {
    name: 'list_sale_packages',
    kind: 'server',
    description: 'List or search sale packages. Use when the user asks what packages/bundles exist.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional name/code filter.' },
        status: { type: 'string', enum: STATUSES, description: 'Optional status filter.' },
        limit:  { type: 'number', description: 'Max rows to return (default 10).' },
      },
    },
    async handler(args, { user }) {
      const { total, items } = await pkgSvc().list({
        search: args.search || '',
        status: args.status || '',
        limit:  Math.min(Math.max(Number(args.limit) || 10, 1), 50),
        organizationId: orgOf(user),
      })
      return {
        result: { total, packages: items.map(slim) },
        action: { type: 'navigate', target: 'sale_packages_list', path: '/erp/sale-packages', label: 'Sale Packages' },
      }
    },
  },

  {
    name: 'get_sale_package',
    kind: 'server',
    description: 'Look up a single sale package and its bundled items by name or code.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Name or code identifying the package.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { pkg, error } = await resolvePackage(args.search, user)
      if (error) return { result: error }
      const full = await pkgSvc().getById(pkg.id, orgOf(user))
      const items = (full.packageItems || []).map((pi) => ({
        saleItem:  pi.saleItem?.name || null,
        code:      pi.saleItem?.code || null,
        quantity:  Number(pi.quantity || 0),
        unitPrice: pi.unitPrice != null ? Number(pi.unitPrice) : null,
      }))
      return {
        result: { ...slim(full), description: full.description || null, items },
        action: { type: 'navigate', target: 'sale_package_edit', path: `/erp/sale-packages/${full.id}/edit`, label: full.name },
      }
    },
  },

  {
    name: 'update_sale_package',
    kind: 'server',
    description: 'Update a sale package. Identify it with `search`; only the fields you pass are changed. '
      + 'Passing `items` replaces the whole bundle line list.',
    parameters: {
      type: 'object',
      properties: {
        search:      { type: 'string', description: 'Name or code identifying the package to update.' },
        name:        { type: 'string' },
        code:        { type: 'string' },
        description: { type: 'string' },
        status:      { type: 'string', enum: STATUSES },
        items:       itemsSchema,
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { pkg, error } = await resolvePackage(args.search, user)
      if (error) return { result: error }

      const patch = {}
      for (const f of ['name', 'code', 'description', 'status']) {
        if (args[f] !== undefined) patch[f] = args[f]
      }
      if (Array.isArray(args.items)) {
        const resolved = await resolvePackageItems(args.items, user)
        if (resolved.error) return { result: resolved.error }
        patch.items = resolved.lines
      }
      if (!Object.keys(patch).length) return { result: 'Nothing to update — pass at least one field to change.' }

      const updated = await pkgSvc().update(pkg.id, patch, user.id, orgOf(user))
      return {
        result: { id: updated.id, name: updated.name, code: updated.code, updated: Object.keys(patch) },
        action: { type: 'navigate', target: 'sale_package_edit', path: `/erp/sale-packages/${updated.id}/edit`, label: updated.name },
      }
    },
  },

  {
    name: 'delete_sale_package',
    kind: 'server',
    description: 'Delete a sale package. Identify it with `search`.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Name or code identifying the package to delete.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { pkg, error } = await resolvePackage(args.search, user)
      if (error) return { result: error }
      const { id, name, code } = pkg
      await pkgSvc().remove(id, orgOf(user))
      return {
        result: `Deleted sale package ${name}${code ? ` (${code})` : ''}.`,
        action: { type: 'navigate', target: 'sale_packages_list', path: '/erp/sale-packages', label: 'Sale Packages' },
      }
    },
  },
]

module.exports = { tools, navTargets, resolvePackage, slim }
