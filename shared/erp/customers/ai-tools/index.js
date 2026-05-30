const tools = [
  {
    name: 'create_customer',
    kind: 'server',
    description: 'Create a new customer.',
    parameters: {
      type: 'object',
      properties: {
        name:    { type: 'string', description: 'Customer name (required).' },
        email:   { type: 'string' },
        phone:   { type: 'string' },
        company: { type: 'string' },
      },
      required: ['name'],
    },
    async handler(args, { user }) {
      const customerSvc = require('../services/customer.service')
      const created = await customerSvc.create({
        name: args.name,
        autoCode: true,
        email: args.email,
        phone: args.phone,
        company: args.company,
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
    description: 'List / search customers.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional name/email/company filter.' },
      },
    },
    async handler(args, { user }) {
      const customerSvc = require('../services/customer.service')
      const { customers, total } = await customerSvc.list({
        search: args.search || '',
        limit: 10,
        organizationId: user.organizationId,
      })
      return {
        result: {
          total,
          customers: customers.map((c) => ({ name: c.name, code: c.code, email: c.email, phone: c.phone })),
        },
        action: { type: 'navigate', target: 'customers_list', path: '/erp/customers', label: 'Customers' },
      }
    },
  },
]

module.exports = tools
