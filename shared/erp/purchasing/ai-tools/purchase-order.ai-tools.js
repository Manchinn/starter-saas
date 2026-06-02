// AI tools for the purchase-order controller (mirrors
// controllers/purchase-order.controller.js + services/purchase-order.service.js).
//
// Purchase orders are line-item workflow documents (draft → confirmed →
// received, with approval thresholds and downstream Good Receives). Like the
// orders/invoices modules, we deliberately do NOT expose create/edit/workflow
// tools to the agent — only read-only lookups plus navigation. The user edits
// and confirms POs on the (safer, validating) document pages.

const navTargets = {
  purchase_orders_list:  { path: '/erp/purchasing/orders',        label: 'Purchase Orders' },
  purchase_orders_create: { path: '/erp/purchasing/orders/create', label: 'New Purchase Order' },
}

const poSvc = () => require('../services/purchase-order.service')
const orgOf = (user) => user?.organizationId || user?.id || null

const STATUSES = ['draft', 'confirmed', 'received', 'cancelled']

const slim = (o) => ({
  id:       o.id,
  refNo:    o.refNo,
  date:     o.date,
  status:   o.status,
  vendor:   o.vendor?.name || null,
  currency: o.currency || null,
})

const lineTotal = (i) => Number(i.qty || 0) * Number(i.unitPrice || 0)

// Resolve a free-text term (reference number) to one purchase order.
async function resolvePO(search, user) {
  const term = (search || '').trim()
  if (!term) return { error: 'Provide a purchase order reference number to identify it.' }

  const { orders } = await poSvc().list({ search: term, limit: 10, organizationId: orgOf(user) })
  if (!orders.length) return { error: `No purchase order matches "${term}".` }
  if (orders.length === 1) return { order: orders[0] }

  const lc = term.toLowerCase()
  const exact = orders.filter((o) => o.refNo && o.refNo.toLowerCase() === lc)
  if (exact.length === 1) return { order: exact[0] }

  const refs = orders.map((o) => o.refNo).join(', ')
  return { error: `Multiple purchase orders match "${term}": ${refs}. Use the exact reference number.` }
}

const tools = [
  {
    name: 'list_purchase_orders',
    kind: 'server',
    description: 'List or search purchase orders. Use when the user asks what POs exist or their status '
      + '(e.g. "draft purchase orders", "POs for vendor X").',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional reference-number / notes filter.' },
        status: { type: 'string', enum: STATUSES, description: 'Optional status filter.' },
        limit:  { type: 'number', description: 'Max rows to return (default 10).' },
      },
    },
    async handler(args, { user }) {
      const { total, orders } = await poSvc().list({
        search: args.search || '',
        status: args.status || '',
        limit:  Math.min(Math.max(Number(args.limit) || 10, 1), 50),
        organizationId: orgOf(user),
      })
      return {
        result: { total, orders: orders.map(slim) },
        action: { type: 'navigate', target: 'purchase_orders_list', path: '/erp/purchasing/orders', label: 'Purchase Orders' },
      }
    },
  },

  {
    name: 'get_purchase_order',
    kind: 'server',
    description: 'Look up a single purchase order\'s full details (header, vendor, line items, total) by '
      + 'reference number.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Reference number identifying the purchase order.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { order, error } = await resolvePO(args.search, user)
      if (error) return { result: error }
      const po = await poSvc().getById(order.id, orgOf(user))
      const items = (po.items || []).map((i) => ({
        product:   i.product?.name || i.description || null,
        qty:       Number(i.qty || 0),
        unitPrice: Number(i.unitPrice || 0),
        lineTotal: lineTotal(i),
      }))
      return {
        result: {
          ...slim(po),
          deliveryDate: po.deliveryDate || null,
          notes:        po.notes || null,
          items,
          total:        items.reduce((s, i) => s + i.lineTotal, 0),
        },
        action: { type: 'navigate', target: 'purchase_order_detail', path: `/erp/purchasing/orders/${po.id}`, label: po.refNo },
      }
    },
  },
]

module.exports = { tools, navTargets, resolvePO, slim }
