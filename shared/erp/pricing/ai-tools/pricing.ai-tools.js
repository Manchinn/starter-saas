// AI tools for the pricing / price-list controller (mirrors
// pricing.controller.js + pricing.service.js).
//
// Aggregated into ai-tools/index.js. Handlers run server-side with
// ctx = { user } and return { result, action? }.
//
// A price list optionally links to a sale item and a customer group. The LLM
// works with names, so those are resolved from free text: the customer group
// reuses the customers tools' resolveGroupId, and the sale item is resolved
// here against the sale-item service.

const { resolveGroupId } = require('../../customers/ai-tools/customer-group.ai-tools')

const navTargets = {
  pricing_list:   { path: '/erp/pricing',        label: 'Price Lists' },
  pricing_create: { path: '/erp/pricing/create', label: 'New Price List' },
}

const pricingSvc  = () => require('../pricing.service')
const saleItemSvc = () => require('../../sale/services/sale-item.service')
const orgOf = (user) => user?.organizationId || user?.id || null

const STATUSES = ['active', 'inactive']

const slim = (p) => ({
  id:            p.id,
  name:          p.name,
  code:          p.code,
  unitPrice:     p.unitPrice != null ? Number(p.unitPrice) : null,
  currency:      p.currency,
  status:        p.status,
  customerGroup: p.customerGroup?.name || null,
  saleItem:      p.saleItem?.name || null,
})

// Resolve a free-text term (name / code) to one price list.
async function resolvePricing(search, user) {
  const term = (search || '').trim()
  if (!term) return { error: 'Provide a price-list name or code to identify it.' }

  const { pricings } = await pricingSvc().list({ search: term, limit: 10, organizationId: orgOf(user) })
  if (!pricings.length) return { error: `No price list matches "${term}".` }
  if (pricings.length === 1) return { pricing: pricings[0] }

  const lc = term.toLowerCase()
  const exact = pricings.filter((p) => [p.name, p.code].some((v) => v && String(v).toLowerCase() === lc))
  if (exact.length === 1) return { pricing: exact[0] }

  const names = pricings.map((p) => `${p.name}${p.code ? ` (${p.code})` : ''}`).join(', ')
  return { error: `Multiple price lists match "${term}": ${names}. Be more specific (use the code or full name).` }
}

// Resolve a free-text term (name / code) to one sale item id. Returns
// { id: null } when no term is given (the link is optional), or { error }.
async function resolveSaleItemId(term, user) {
  const t = (term || '').trim()
  if (!t) return { id: null }
  const { items } = await saleItemSvc().list({ search: t, limit: 10, organizationId: orgOf(user) })
  if (!items.length) return { error: `No sale item matches "${t}".` }
  if (items.length === 1) return { id: items[0].id }
  const lc = t.toLowerCase()
  const exact = items.filter((i) => [i.name, i.code].some((v) => v && String(v).toLowerCase() === lc))
  if (exact.length === 1) return { id: exact[0].id }
  const names = items.map((i) => `${i.name}${i.code ? ` (${i.code})` : ''}`).join(', ')
  return { error: `Multiple sale items match "${t}": ${names}. Be more specific.` }
}

const tools = [
  {
    name: 'create_pricing',
    kind: 'server',
    description: 'Create a price list entry (a named unit price). If no code is given, one is auto-generated. '
      + 'Optionally tie it to a sale item and/or a customer group.',
    parameters: {
      type: 'object',
      properties: {
        name:          { type: 'string', description: 'Price list name (required).' },
        unitPrice:     { type: 'number', description: 'Unit price (required).' },
        currency:      { type: 'string', description: 'Currency code, default USD.' },
        code:          { type: 'string', description: 'Optional code; auto-generated when omitted.' },
        description:   { type: 'string' },
        status:        { type: 'string', enum: STATUSES, description: 'Default active.' },
        saleItem:      { type: 'string', description: 'Optional sale item name/code to attach the price to.' },
        customerGroup: { type: 'string', description: 'Optional customer group name this price applies to.' },
      },
      required: ['name', 'unitPrice'],
    },
    async handler(args, { user }) {
      const sale = await resolveSaleItemId(args.saleItem, user)
      if (sale.error) return { result: sale.error }
      const customerGroupId = await resolveGroupId(args.customerGroup, user)

      const created = await pricingSvc().create({
        name:        args.name,
        unitPrice:   args.unitPrice,
        currency:    args.currency || 'USD',
        code:        args.code,
        autoCode:    !args.code,
        description: args.description,
        status:      args.status || 'active',
        saleItemId:  sale.id,
        customerGroupId,
        userId:      user.id,
        organizationId: orgOf(user),
      })
      return {
        result: { id: created.id, name: created.name, code: created.code, unitPrice: Number(created.unitPrice), currency: created.currency },
        action: { type: 'navigate', target: 'pricing_edit', path: `/erp/pricing/${created.id}/edit`, label: created.name },
      }
    },
  },

  {
    name: 'list_pricings',
    kind: 'server',
    description: 'List or search price lists. Use when the user asks what prices / price lists exist.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional name filter.' },
        status: { type: 'string', enum: STATUSES, description: 'Optional status filter.' },
        limit:  { type: 'number', description: 'Max rows to return (default 10).' },
      },
    },
    async handler(args, { user }) {
      const { total, pricings } = await pricingSvc().list({
        search: args.search || '',
        status: args.status || '',
        limit:  Math.min(Math.max(Number(args.limit) || 10, 1), 50),
        organizationId: orgOf(user),
      })
      return {
        result: { total, pricings: pricings.map(slim) },
        action: { type: 'navigate', target: 'pricing_list', path: '/erp/pricing', label: 'Price Lists' },
      }
    },
  },

  {
    name: 'get_pricing',
    kind: 'server',
    description: 'Look up a single price list\'s full details by name or code.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Name or code identifying the price list.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { pricing, error } = await resolvePricing(args.search, user)
      if (error) return { result: error }
      const full = await pricingSvc().getById(pricing.id, orgOf(user))
      return {
        result: { ...slim(full), description: full.description || null },
        action: { type: 'navigate', target: 'pricing_edit', path: `/erp/pricing/${full.id}/edit`, label: full.name },
      }
    },
  },

  {
    name: 'update_pricing',
    kind: 'server',
    description: 'Update a price list. Identify it with `search`; only the fields you pass are changed.',
    parameters: {
      type: 'object',
      properties: {
        search:        { type: 'string', description: 'Name or code identifying the price list to update.' },
        name:          { type: 'string' },
        code:          { type: 'string' },
        description:   { type: 'string' },
        unitPrice:     { type: 'number' },
        currency:      { type: 'string' },
        status:        { type: 'string', enum: STATUSES },
        saleItem:      { type: 'string', description: 'Sale item name/code to attach (use empty string to clear).' },
        customerGroup: { type: 'string', description: 'Customer group name to apply.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { pricing, error } = await resolvePricing(args.search, user)
      if (error) return { result: error }

      const patch = {}
      for (const f of ['name', 'code', 'description', 'unitPrice', 'currency', 'status']) {
        if (args[f] !== undefined) patch[f] = args[f]
      }
      if (args.saleItem !== undefined) {
        const sale = await resolveSaleItemId(args.saleItem, user)
        if (sale.error) return { result: sale.error }
        patch.saleItemId = sale.id
      }
      if (args.customerGroup !== undefined) {
        patch.customerGroupId = await resolveGroupId(args.customerGroup, user)
      }
      if (!Object.keys(patch).length) return { result: 'Nothing to update — pass at least one field to change.' }

      const updated = await pricingSvc().update(pricing.id, patch, user.id, orgOf(user))
      return {
        result: { id: updated.id, name: updated.name, code: updated.code, updated: Object.keys(patch) },
        action: { type: 'navigate', target: 'pricing_edit', path: `/erp/pricing/${updated.id}/edit`, label: updated.name },
      }
    },
  },

  {
    name: 'delete_pricing',
    kind: 'server',
    description: 'Delete a price list. Identify it with `search`.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Name or code identifying the price list to delete.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { pricing, error } = await resolvePricing(args.search, user)
      if (error) return { result: error }
      const { id, name, code } = pricing
      await pricingSvc().remove(id, orgOf(user))
      return {
        result: `Deleted price list ${name}${code ? ` (${code})` : ''}.`,
        action: { type: 'navigate', target: 'pricing_list', path: '/erp/pricing', label: 'Price Lists' },
      }
    },
  },
]

module.exports = { tools, navTargets, resolvePricing, resolveSaleItemId, slim }
