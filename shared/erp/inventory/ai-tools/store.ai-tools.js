// AI tools for the store/warehouse controller (mirrors
// controllers/store.controller.js + services/store.service.js).
//
// Aggregated into ai-tools/index.js. Handlers run server-side with
// ctx = { user } and return { result, action? }.
//
// The LLM works with names, not UUIDs, so get/update/delete first resolve a
// free-text term to exactly one store before acting.

const navTargets = {
  stores_list:  { path: '/erp/stores',        label: 'Stores' },
  store_create: { path: '/erp/stores/create', label: 'New Store' },
}

const storeSvc = () => require('../services/store.service')
const orgOf = (user) => user?.organizationId || user?.id || null

const STATUSES = ['active', 'inactive']

const slim = (s) => ({
  id:     s.id,
  name:   s.name,
  code:   s.code,
  status: s.status,
  email:  s.email,
  phone:  s.phone,
})

// Resolve a free-text term (name / code) to one store.
async function resolveStore(search, user) {
  const term = (search || '').trim()
  if (!term) return { error: 'Provide a store name or code to identify the store.' }

  const { stores } = await storeSvc().list({ search: term, limit: 10, organizationId: orgOf(user) })
  if (!stores.length) return { error: `No store matches "${term}".` }
  if (stores.length === 1) return { store: stores[0] }

  const lc = term.toLowerCase()
  const exact = stores.filter((s) => [s.name, s.code].some((v) => v && String(v).toLowerCase() === lc))
  if (exact.length === 1) return { store: exact[0] }

  const names = stores.map((s) => `${s.name}${s.code ? ` (${s.code})` : ''}`).join(', ')
  return { error: `Multiple stores match "${term}": ${names}. Be more specific (use the code or full name).` }
}

const tools = [
  {
    name: 'create_store',
    kind: 'server',
    description: 'Create a new store / warehouse. If no code is given, one is auto-generated.',
    parameters: {
      type: 'object',
      properties: {
        name:    { type: 'string', description: 'Store name (required).' },
        code:    { type: 'string', description: 'Optional store code; auto-generated when omitted.' },
        address: { type: 'string' },
        phone:   { type: 'string' },
        email:   { type: 'string' },
        status:  { type: 'string', enum: STATUSES, description: 'Default active.' },
      },
      required: ['name'],
    },
    async handler(args, { user }) {
      const created = await storeSvc().create({
        name:     args.name,
        code:     args.code,
        autoCode: !args.code,
        address:  args.address,
        phone:    args.phone,
        email:    args.email,
        status:   args.status || 'active',
        userId:   user.id,
        organizationId: orgOf(user),
      })
      return {
        result: { id: created.id, name: created.name, code: created.code },
        action: { type: 'navigate', target: 'store_edit', path: `/erp/stores/${created.id}/edit`, label: created.name },
      }
    },
  },

  {
    name: 'list_stores',
    kind: 'server',
    description: 'List or search stores / warehouses. Use when the user asks what stores or warehouses exist.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional name/code filter.' },
        status: { type: 'string', enum: STATUSES, description: 'Optional status filter.' },
        limit:  { type: 'number', description: 'Max rows to return (default 10).' },
      },
    },
    async handler(args, { user }) {
      const { total, stores } = await storeSvc().list({
        search: args.search || '',
        status: args.status || '',
        limit:  Math.min(Math.max(Number(args.limit) || 10, 1), 50),
        organizationId: orgOf(user),
      })
      return {
        result: { total, stores: stores.map(slim) },
        action: { type: 'navigate', target: 'stores_list', path: '/erp/stores', label: 'Stores' },
      }
    },
  },

  {
    name: 'get_store',
    kind: 'server',
    description: 'Look up a single store\'s details by name or code.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Name or code identifying the store.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { store, error } = await resolveStore(args.search, user)
      if (error) return { result: error }
      return {
        result: { ...slim(store), address: store.address || null },
        action: { type: 'navigate', target: 'store_edit', path: `/erp/stores/${store.id}/edit`, label: store.name },
      }
    },
  },

  {
    name: 'update_store',
    kind: 'server',
    description: 'Update an existing store. Identify it with `search`; only the fields you pass are changed.',
    parameters: {
      type: 'object',
      properties: {
        search:  { type: 'string', description: 'Name or code identifying the store to update.' },
        name:    { type: 'string' },
        code:    { type: 'string' },
        address: { type: 'string' },
        phone:   { type: 'string' },
        email:   { type: 'string' },
        status:  { type: 'string', enum: STATUSES },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { store, error } = await resolveStore(args.search, user)
      if (error) return { result: error }

      const patch = {}
      for (const f of ['name', 'code', 'address', 'phone', 'email', 'status']) {
        if (args[f] !== undefined) patch[f] = args[f]
      }
      if (!Object.keys(patch).length) return { result: 'Nothing to update — pass at least one field to change.' }

      const updated = await storeSvc().update(store.id, patch, user.id, orgOf(user))
      return {
        result: { id: updated.id, name: updated.name, code: updated.code, updated: Object.keys(patch) },
        action: { type: 'navigate', target: 'store_edit', path: `/erp/stores/${updated.id}/edit`, label: updated.name },
      }
    },
  },

  {
    name: 'delete_store',
    kind: 'server',
    description: 'Delete a store. Identify it with `search`. Fails if the store still has stock on hand.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Name or code identifying the store to delete.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { store, error } = await resolveStore(args.search, user)
      if (error) return { result: error }
      const { id, name, code } = store
      await storeSvc().remove(id, orgOf(user))
      return {
        result: `Deleted store ${name}${code ? ` (${code})` : ''}.`,
        action: { type: 'navigate', target: 'stores_list', path: '/erp/stores', label: 'Stores' },
      }
    },
  },
]

module.exports = { tools, navTargets, resolveStore, slim }
