// AI tools for the customer controller (mirrors
// controllers/customer.controller.js + services/customer.service.js).
//
// Aggregated into ai-tools/index.js. Handlers run server-side with
// ctx = { user: { id, organizationId } } and return { result, action? }.
//
// The LLM works with names, not UUIDs, so get/update/delete first resolve a
// free-text term to exactly one customer before acting.

const { resolveGroupId } = require('./customer-group.ai-tools')

const navTargets = {
  customers_list:  { path: '/erp/customers',        label: 'Customers' },
  customer_create: { path: '/erp/customers/create', label: 'New Customer' },
}

const customerSvc = () => require('../services/customer.service')

// Shape a customer row into a compact, model-friendly object.
const slim = (c) => ({
  id:      c.id,
  name:    c.name,
  code:    c.code,
  email:   c.email,
  phone:   c.phone,
  company: c.company,
  status:  c.status,
  group:   c.group?.name || null,
})

// Resolve a free-text term (name / email / company / code) to one customer.
// Returns { customer } on a unique hit, or { error } describing why not.
async function resolveCustomer(search, user) {
  const term = (search || '').trim()
  if (!term) return { error: 'Provide a customer name, code, email, or company to identify the customer.' }

  const { customers } = await customerSvc().list({ search: term, limit: 10, organizationId: user.organizationId })
  if (!customers.length) return { error: `No customer matches "${term}".` }
  if (customers.length === 1) return { customer: customers[0] }

  // Disambiguate an over-broad term by an exact (case-insensitive) match.
  const lc = term.toLowerCase()
  const exact = customers.filter((c) => [c.name, c.code, c.email].some((v) => v && String(v).toLowerCase() === lc))
  if (exact.length === 1) return { customer: exact[0] }

  const names = customers.map((c) => `${c.name}${c.code ? ` (${c.code})` : ''}`).join(', ')
  return { error: `Multiple customers match "${term}": ${names}. Be more specific (use the code or full name).` }
}

const tools = [
  {
    name: 'create_customer',
    kind: 'server',
    description: 'Create a new customer. The code is auto-generated.',
    parameters: {
      type: 'object',
      properties: {
        name:    { type: 'string', description: 'Customer name (required).' },
        email:   { type: 'string' },
        phone:   { type: 'string' },
        company: { type: 'string' },
        address: { type: 'string' },
        notes:   { type: 'string' },
        group:   { type: 'string', description: 'Customer group name to assign (optional).' },
      },
      required: ['name'],
    },
    async handler(args, { user }) {
      const customerGroupId = await resolveGroupId(args.group, user)
      const created = await customerSvc().create({
        name: args.name,
        autoCode: true,
        email: args.email,
        phone: args.phone,
        company: args.company,
        address: args.address,
        notes: args.notes,
        customerGroupId,
        userId: user.id,
        organizationId: user.organizationId,
      })
      return {
        result: { id: created.id, name: created.name, code: created.code },
        action: { type: 'navigate', target: 'customer_edit', path: `/erp/customers/${created.id}/edit`, label: created.name },
      }
    },
  },

  {
    name: 'list_customers',
    kind: 'server',
    description: 'List or search customers. Use when the user asks what customers exist or to find customers.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional name/email/company filter.' },
        status: { type: 'string', enum: ['active', 'inactive'], description: 'Optional status filter.' },
        limit:  { type: 'number', description: 'Max rows to return (default 10).' },
      },
    },
    async handler(args, { user }) {
      const { customers, total } = await customerSvc().list({
        search: args.search || '',
        status: args.status || '',
        limit: Math.min(Math.max(Number(args.limit) || 10, 1), 50),
        organizationId: user.organizationId,
      })
      return {
        result: { total, customers: customers.map(slim) },
        action: { type: 'navigate', target: 'customers_list', path: '/erp/customers', label: 'Customers' },
      }
    },
  },

  {
    name: 'get_customer',
    kind: 'server',
    description: 'Look up a single customer\'s full details by name, code, email, or company.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Name, code, email, or company to identify the customer.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { customer, error } = await resolveCustomer(args.search, user)
      if (error) return { result: error }
      return {
        result: {
          ...slim(customer),
          address: customer.address || null,
          notes:   customer.notes || null,
        },
        action: { type: 'navigate', target: 'customer_edit', path: `/erp/customers/${customer.id}/edit`, label: customer.name },
      }
    },
  },

  {
    name: 'update_customer',
    kind: 'server',
    description: 'Update an existing customer. Identify it with `search`; only the fields you pass are changed.',
    parameters: {
      type: 'object',
      properties: {
        search:  { type: 'string', description: 'Name, code, email, or company identifying the customer to update.' },
        name:    { type: 'string' },
        email:   { type: 'string' },
        phone:   { type: 'string' },
        company: { type: 'string' },
        address: { type: 'string' },
        notes:   { type: 'string' },
        status:  { type: 'string', enum: ['active', 'inactive'] },
        group:   { type: 'string', description: 'Customer group name to assign.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { customer, error } = await resolveCustomer(args.search, user)
      if (error) return { result: error }

      const patch = {}
      for (const f of ['name', 'email', 'phone', 'company', 'address', 'notes', 'status']) {
        if (args[f] !== undefined) patch[f] = args[f]
      }
      if (args.group !== undefined) patch.customerGroupId = await resolveGroupId(args.group, user)
      if (!Object.keys(patch).length) return { result: 'Nothing to update — pass at least one field to change.' }

      const updated = await customerSvc().update(customer.id, patch, user.id, user.organizationId)
      return {
        result: { id: updated.id, name: updated.name, code: updated.code, updated: Object.keys(patch) },
        action: { type: 'navigate', target: 'customer_edit', path: `/erp/customers/${updated.id}/edit`, label: updated.name },
      }
    },
  },

  {
    name: 'delete_customer',
    kind: 'server',
    description: 'Delete a customer. Identify it with `search`. This cannot be undone.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Name, code, email, or company identifying the customer to delete.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { customer, error } = await resolveCustomer(args.search, user)
      if (error) return { result: error }
      const { id, name, code } = customer
      await customerSvc().remove(id, user.organizationId)
      return {
        result: `Deleted customer ${name}${code ? ` (${code})` : ''}.`,
        action: { type: 'navigate', target: 'customers_list', path: '/erp/customers', label: 'Customers' },
      }
    },
  },
]

module.exports = { tools, navTargets, resolveCustomer, slim }
