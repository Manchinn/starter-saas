// AI tools for the unit-of-measure controller (mirrors
// controllers/uom.controller.js + services/uom.service.js).
//
// Aggregated into ai-tools/index.js. Handlers run server-side with
// ctx = { user } and return { result, action? }. `resolveUom` is exported so
// the UOM-conversion tools can turn a unit name into its id.

const navTargets = {
  uoms_list:  { path: '/erp/uom',        label: 'Units of Measure' },
  uom_create: { path: '/erp/uom/create', label: 'New UOM' },
}

const uomSvc = () => require('../services/uom.service')
const orgOf = (user) => user?.organizationId || user?.id || null

const STATUSES = ['active', 'inactive']

const slim = (u) => ({
  id:           u.id,
  name:         u.name,
  abbreviation: u.abbreviation,
  status:       u.status,
  description:  u.description || null,
})

// Resolve a free-text term (name / abbreviation) to one unit of measure.
async function resolveUom(search, user) {
  const term = (search || '').trim()
  if (!term) return { error: 'Provide a unit name or abbreviation to identify the UOM.' }

  const { uoms } = await uomSvc().list({ search: term, limit: 10, organizationId: orgOf(user) })
  if (!uoms.length) return { error: `No unit of measure matches "${term}".` }
  if (uoms.length === 1) return { uom: uoms[0] }

  const lc = term.toLowerCase()
  const exact = uoms.filter((u) => [u.name, u.abbreviation].some((v) => v && String(v).toLowerCase() === lc))
  if (exact.length === 1) return { uom: exact[0] }

  const names = uoms.map((u) => `${u.name} (${u.abbreviation})`).join(', ')
  return { error: `Multiple units match "${term}": ${names}. Be more specific (use the exact name or abbreviation).` }
}

const tools = [
  {
    name: 'create_uom',
    kind: 'server',
    description: 'Create a new unit of measure (e.g. Kilogram / kg, Box / bx).',
    parameters: {
      type: 'object',
      properties: {
        name:         { type: 'string', description: 'Unit name, e.g. "Kilogram" (required).' },
        abbreviation: { type: 'string', description: 'Short symbol, e.g. "kg" (required, must be unique).' },
        description:  { type: 'string' },
        status:       { type: 'string', enum: STATUSES, description: 'Default active.' },
      },
      required: ['name', 'abbreviation'],
    },
    async handler(args, { user }) {
      const created = await uomSvc().create({
        name:         args.name,
        abbreviation: args.abbreviation,
        description:  args.description,
        status:       args.status || 'active',
        userId:       user.id,
        organizationId: orgOf(user),
      })
      return {
        result: { id: created.id, name: created.name, abbreviation: created.abbreviation },
        action: { type: 'navigate', target: 'uom_edit', path: `/erp/uom/${created.id}/edit`, label: created.name },
      }
    },
  },

  {
    name: 'list_uoms',
    kind: 'server',
    description: 'List or search units of measure. Use when the user asks what units exist.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional name/abbreviation filter.' },
        status: { type: 'string', enum: STATUSES, description: 'Optional status filter.' },
        limit:  { type: 'number', description: 'Max rows to return (default 10).' },
      },
    },
    async handler(args, { user }) {
      const { total, uoms } = await uomSvc().list({
        search: args.search || '',
        status: args.status || '',
        limit:  Math.min(Math.max(Number(args.limit) || 10, 1), 50),
        organizationId: orgOf(user),
      })
      return {
        result: { total, uoms: uoms.map(slim) },
        action: { type: 'navigate', target: 'uoms_list', path: '/erp/uom', label: 'Units of Measure' },
      }
    },
  },

  {
    name: 'get_uom',
    kind: 'server',
    description: 'Look up a single unit of measure by name or abbreviation.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Name or abbreviation identifying the unit.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { uom, error } = await resolveUom(args.search, user)
      if (error) return { result: error }
      return {
        result: slim(uom),
        action: { type: 'navigate', target: 'uom_edit', path: `/erp/uom/${uom.id}/edit`, label: uom.name },
      }
    },
  },

  {
    name: 'update_uom',
    kind: 'server',
    description: 'Update a unit of measure. Identify it with `search`; only the fields you pass are changed.',
    parameters: {
      type: 'object',
      properties: {
        search:       { type: 'string', description: 'Name or abbreviation identifying the unit to update.' },
        name:         { type: 'string' },
        abbreviation: { type: 'string' },
        description:  { type: 'string' },
        status:       { type: 'string', enum: STATUSES },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { uom, error } = await resolveUom(args.search, user)
      if (error) return { result: error }

      const patch = {}
      for (const f of ['name', 'abbreviation', 'description', 'status']) {
        if (args[f] !== undefined) patch[f] = args[f]
      }
      if (!Object.keys(patch).length) return { result: 'Nothing to update — pass at least one field to change.' }

      const updated = await uomSvc().update(uom.id, patch, user.id, orgOf(user))
      return {
        result: { id: updated.id, name: updated.name, abbreviation: updated.abbreviation, updated: Object.keys(patch) },
        action: { type: 'navigate', target: 'uom_edit', path: `/erp/uom/${updated.id}/edit`, label: updated.name },
      }
    },
  },

  {
    name: 'delete_uom',
    kind: 'server',
    description: 'Delete a unit of measure. Identify it with `search`.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Name or abbreviation identifying the unit to delete.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { uom, error } = await resolveUom(args.search, user)
      if (error) return { result: error }
      const { id, name, abbreviation } = uom
      await uomSvc().remove(id, orgOf(user))
      return {
        result: `Deleted unit ${name} (${abbreviation}).`,
        action: { type: 'navigate', target: 'uoms_list', path: '/erp/uom', label: 'Units of Measure' },
      }
    },
  },
]

module.exports = { tools, navTargets, resolveUom, slim }
