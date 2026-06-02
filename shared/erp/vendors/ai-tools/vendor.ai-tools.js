// AI tools for the vendor controller (mirrors vendor.routes.js +
// vendor.service.js).
//
// Vendors are master data, so they get full CRUD. The LLM works with names,
// not UUIDs, so get/update/delete first resolve a free-text term to exactly one
// vendor before acting.

const navTargets = {
  vendors_list:  { path: '/erp/vendors',        label: 'Vendors' },
  vendor_create: { path: '/erp/vendors/create', label: 'New Vendor' },
}

const vendorSvc = () => require('../vendor.service')
const orgOf = (user) => user?.organizationId || user?.id || null

const STATUSES = ['active', 'inactive']

const slim = (v) => ({
  id:            v.id,
  name:          v.name,
  code:          v.code,
  status:        v.status,
  email:         v.email,
  phone:         v.phone,
  contactPerson: v.contactPerson,
  vendorTypes:   v.vendorTypes || [],
})

// Resolve a free-text term (name / code / email) to one vendor.
async function resolveVendor(search, user) {
  const term = (search || '').trim()
  if (!term) return { error: 'Provide a vendor name, code, or email to identify the vendor.' }

  const { vendors } = await vendorSvc().list({ search: term, limit: 10, organizationId: orgOf(user) })
  if (!vendors.length) return { error: `No vendor matches "${term}".` }
  if (vendors.length === 1) return { vendor: vendors[0] }

  const lc = term.toLowerCase()
  const exact = vendors.filter((v) => [v.name, v.code, v.email].some((x) => x && String(x).toLowerCase() === lc))
  if (exact.length === 1) return { vendor: exact[0] }

  const names = vendors.map((v) => `${v.name}${v.code ? ` (${v.code})` : ''}`).join(', ')
  return { error: `Multiple vendors match "${term}": ${names}. Be more specific (use the code or full name).` }
}

const tools = [
  {
    name: 'create_vendor',
    kind: 'server',
    description: 'Create a new vendor / supplier. If no code is given, one is auto-generated.',
    parameters: {
      type: 'object',
      properties: {
        name:          { type: 'string', description: 'Vendor name (required).' },
        code:          { type: 'string', description: 'Optional code; auto-generated when omitted.' },
        contactPerson: { type: 'string' },
        email:         { type: 'string' },
        phone:         { type: 'string' },
        address:       { type: 'string' },
        notes:         { type: 'string' },
        vendorTypes:   { type: 'array', items: { type: 'string' }, description: 'Optional list of vendor type tags.' },
        status:        { type: 'string', enum: STATUSES, description: 'Default active.' },
      },
      required: ['name'],
    },
    async handler(args, { user }) {
      const created = await vendorSvc().create({
        name:          args.name,
        code:          args.code,
        autoCode:      !args.code,
        contactPerson: args.contactPerson,
        email:         args.email,
        phone:         args.phone,
        address:       args.address,
        notes:         args.notes,
        vendorTypes:   args.vendorTypes || [],
        status:        args.status || 'active',
        userId:        user.id,
        organizationId: orgOf(user),
      })
      return {
        result: { id: created.id, name: created.name, code: created.code },
        action: { type: 'navigate', target: 'vendor_edit', path: `/erp/vendors/${created.id}/edit`, label: created.name },
      }
    },
  },

  {
    name: 'list_vendors',
    kind: 'server',
    description: 'List or search vendors / suppliers. Use when the user asks what vendors exist or to find vendors.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional name/code/email filter.' },
        status: { type: 'string', enum: STATUSES, description: 'Optional status filter.' },
        limit:  { type: 'number', description: 'Max rows to return (default 10).' },
      },
    },
    async handler(args, { user }) {
      const { total, vendors } = await vendorSvc().list({
        search: args.search || '',
        status: args.status || '',
        limit:  Math.min(Math.max(Number(args.limit) || 10, 1), 50),
        organizationId: orgOf(user),
      })
      return {
        result: { total, vendors: vendors.map(slim) },
        action: { type: 'navigate', target: 'vendors_list', path: '/erp/vendors', label: 'Vendors' },
      }
    },
  },

  {
    name: 'get_vendor',
    kind: 'server',
    description: 'Look up a single vendor\'s full details by name, code, or email.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Name, code, or email identifying the vendor.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { vendor, error } = await resolveVendor(args.search, user)
      if (error) return { result: error }
      return {
        result: { ...slim(vendor), address: vendor.address || null, notes: vendor.notes || null },
        action: { type: 'navigate', target: 'vendor_edit', path: `/erp/vendors/${vendor.id}/edit`, label: vendor.name },
      }
    },
  },

  {
    name: 'update_vendor',
    kind: 'server',
    description: 'Update an existing vendor. Identify it with `search`; only the fields you pass are changed.',
    parameters: {
      type: 'object',
      properties: {
        search:        { type: 'string', description: 'Name, code, or email identifying the vendor to update.' },
        name:          { type: 'string' },
        code:          { type: 'string' },
        contactPerson: { type: 'string' },
        email:         { type: 'string' },
        phone:         { type: 'string' },
        address:       { type: 'string' },
        notes:         { type: 'string' },
        vendorTypes:   { type: 'array', items: { type: 'string' } },
        status:        { type: 'string', enum: STATUSES },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { vendor, error } = await resolveVendor(args.search, user)
      if (error) return { result: error }

      const patch = {}
      for (const f of ['name', 'code', 'contactPerson', 'email', 'phone', 'address', 'notes', 'vendorTypes', 'status']) {
        if (args[f] !== undefined) patch[f] = args[f]
      }
      if (!Object.keys(patch).length) return { result: 'Nothing to update — pass at least one field to change.' }

      const updated = await vendorSvc().update(vendor.id, patch, user.id, orgOf(user))
      return {
        result: { id: updated.id, name: updated.name, code: updated.code, updated: Object.keys(patch) },
        action: { type: 'navigate', target: 'vendor_edit', path: `/erp/vendors/${updated.id}/edit`, label: updated.name },
      }
    },
  },

  {
    name: 'delete_vendor',
    kind: 'server',
    description: 'Delete a vendor. Identify it with `search`. This cannot be undone.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Name, code, or email identifying the vendor to delete.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { vendor, error } = await resolveVendor(args.search, user)
      if (error) return { result: error }
      const { id, name, code } = vendor
      await vendorSvc().remove(id, orgOf(user))
      return {
        result: `Deleted vendor ${name}${code ? ` (${code})` : ''}.`,
        action: { type: 'navigate', target: 'vendors_list', path: '/erp/vendors', label: 'Vendors' },
      }
    },
  },
]

module.exports = { tools, navTargets, resolveVendor, slim }
