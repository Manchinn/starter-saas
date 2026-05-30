// AI tools for the customer-group controller (mirrors
// controllers/customer-group.controller.js + services/customer-group.service.js).
//
// Aggregated into ai-tools/index.js. Handlers run server-side with
// ctx = { user: { id, organizationId } } and return { result, action? }.

const navTargets = {
  customer_groups_list:  { path: '/erp/customer-groups',        label: 'Customer Groups' },
  customer_group_create: { path: '/erp/customer-groups/create', label: 'New Customer Group' },
}

const groupSvc = () => require('../services/customer-group.service')

// Map a customer-group name to its id (case-insensitive). Returns null when
// the name is blank or no active group matches. Shared with the customer
// tools so assigning a group by name lives in one place.
async function resolveGroupId(groupName, user) {
  const name = (groupName || '').trim()
  if (!name) return null
  const groups = await groupSvc().listAll(user.organizationId)
  const hit = groups.find((g) => g.name.toLowerCase() === name.toLowerCase())
  return hit ? hit.id : null
}

const tools = [
  {
    name: 'create_customer_group',
    kind: 'server',
    description: 'Create a new customer group. The code is auto-generated.',
    parameters: {
      type: 'object',
      properties: {
        name:        { type: 'string', description: 'Group name (required).' },
        description: { type: 'string' },
      },
      required: ['name'],
    },
    async handler(args, { user }) {
      const created = await groupSvc().create({
        name: args.name,
        autoCode: true,
        description: args.description,
        userId: user.id,
        organizationId: user.organizationId,
      })
      return {
        result: { id: created.id, name: created.name, code: created.code },
        action: { type: 'navigate', target: 'customer_group_edit', path: `/erp/customer-groups/${created.id}/edit`, label: created.name },
      }
    },
  },

  {
    name: 'list_customer_groups',
    kind: 'server',
    description: 'List or search customer groups.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional name filter.' },
      },
    },
    async handler(args, { user }) {
      const { groups, total } = await groupSvc().list({
        search: args.search || '',
        limit: 20,
        organizationId: user.organizationId,
      })
      return {
        result: {
          total,
          groups: groups.map((g) => ({ id: g.id, name: g.name, code: g.code, status: g.status })),
        },
        action: { type: 'navigate', target: 'customer_groups_list', path: '/erp/customer-groups', label: 'Customer Groups' },
      }
    },
  },
]

module.exports = { tools, navTargets, resolveGroupId }
