/**
 * Tool registry for the AI agent.
 *
 * Each tool: { name, description, kind, parameters, handler }
 *   kind 'server' — runs on the backend (mutates/reads data), result fed to the model
 *   kind 'client' — produces a client action (e.g. SPA navigation) for the browser
 *
 * Handlers are async (args, ctx) where ctx = { user: { id, organizationId } }.
 * A handler may return:
 *   { result, action }   — `result` (string|object) is summarized back to the
 *                          model; `action` is forwarded to the client to run.
 *
 * ERP services are required lazily inside handlers to avoid any module
 * load-order coupling (same pattern product.service uses for sequence.service).
 */

const customerTools = require('../../erp/customers/tools')

// Friendly page targets the `navigate` tool understands → real SPA routes.
const NAV_TARGETS = {
  dashboard:        { path: '/erp/dashboard',           label: 'Dashboard' },
  products_list:    { path: '/erp/item-master',         label: 'Products' },
  product_create:   { path: '/erp/item-master/create',  label: 'New Product' },
  customers_list:   { path: '/erp/customers',           label: 'Customers' },
  customer_create:  { path: '/erp/customers/create',    label: 'New Customer' },
  orders_list:      { path: '/erp/orders',              label: 'Orders' },
  order_create:     { path: '/erp/orders/create',       label: 'New Order' },
  invoices_list:    { path: '/erp/invoices',            label: 'Invoices' },
  invoice_create:   { path: '/erp/invoices/create',     label: 'New Invoice' },
  settings:         { path: '/erp/settings/general',    label: 'Settings' },
}

const tools = [
  {
    name: 'navigate',
    kind: 'client',
    description: 'Open a page in the app. Use when the user wants to go to, open, show or view a section.',
    parameters: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: Object.keys(NAV_TARGETS),
          description: 'Which page to open.',
        },
      },
      required: ['target'],
    },
    async handler(args) {
      const target = NAV_TARGETS[args.target]
      if (!target) {
        return { result: `Unknown page "${args.target}". Valid pages: ${Object.keys(NAV_TARGETS).join(', ')}.` }
      }
      return {
        result: `Opened ${target.label}.`,
        action: { type: 'navigate', target: args.target, path: target.path, label: target.label },
      }
    },
  },

  {
    name: 'create_product',
    kind: 'server',
    description: 'Create a new product / item in the catalogue.',
    parameters: {
      type: 'object',
      properties: {
        name:     { type: 'string', description: 'Product name (required).' },
        sku:      { type: 'string', description: 'Stock keeping unit / code. Omit to auto-generate.' },
        cost:     { type: 'number', description: 'Unit cost.' },
        category: { type: 'string', description: 'Category label.' },
      },
      required: ['name'],
    },
    async handler(args, { user }) {
      const productSvc = require('../../erp/products/services/product.service')
      const created = await productSvc.create({
        name: args.name,
        sku: args.sku,
        autoCode: !args.sku,
        cost: args.cost,
        category: args.category,
        userId: user.id,
        organizationId: user.organizationId,
      })
      return {
        result: { id: created.id, name: created.name, sku: created.sku },
        action: { type: 'navigate', target: 'product_edit', path: `/erp/item-master/${created.id}/edit`, label: created.name },
      }
    },
  },

  {
    name: 'list_products',
    kind: 'server',
    description: 'List / search products. Use when the user asks what products exist or to find a product.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional name/SKU/category filter.' },
      },
    },
    async handler(args, { user }) {
      const productSvc = require('../../erp/products/services/product.service')
      const { products, total } = await productSvc.list({
        search: args.search || '',
        limit: 10,
        organizationId: user.organizationId,
      })
      return {
        result: {
          total,
          products: products.map((p) => ({ name: p.name, sku: p.sku, cost: p.cost, status: p.status })),
        },
        action: { type: 'navigate', target: 'products_list', path: '/erp/item-master', label: 'Products' },
      }
    },
  },

  ...customerTools,
]

const byName = new Map(tools.map((t) => [t.name, t]))

// OpenAI-style tool schema array sent to the LLM.
const schemas = () => tools.map((t) => ({
  type: 'function',
  function: { name: t.name, description: t.description, parameters: t.parameters },
}))

// Execute a tool by name. Returns { content, action? } where content is a
// string the model can read. Tool failures are returned as content (not thrown)
// so the agent can apologize/recover instead of 500-ing.
const execute = async (name, args, ctx) => {
  const tool = byName.get(name)
  if (!tool) return { content: `Error: no such tool "${name}".` }
  try {
    const { result, action } = await tool.handler(args || {}, ctx)
    const content = typeof result === 'string' ? result : JSON.stringify(result)
    return { content, action }
  } catch (err) {
    return { content: `Error running ${name}: ${err.message || 'failed'}` }
  }
}

module.exports = { tools, schemas, execute, NAV_TARGETS }
