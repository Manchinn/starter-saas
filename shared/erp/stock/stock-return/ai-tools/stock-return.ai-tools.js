// AI tools for the stock-return controller (mirrors stock-return.controller.js +
// stock-return.service.js).
//
// A stock return is a stock-posting document (customer returns add stock back,
// vendor returns remove it; confirming records movements). Like the other stock
// workflow documents, the agent gets read-only lookups + navigation only — no
// create/edit/confirm tools.

const navTargets = {
  stock_returns_list:   { path: '/erp/stock-return',        label: 'Stock Returns' },
  stock_returns_create: { path: '/erp/stock-return/create', label: 'New Stock Return' },
}

const returnSvc = () => require('../stock-return.service')
const orgOf = (user) => user?.organizationId || user?.id || null

const TYPES = ['customer_return', 'vendor_return']

const slim = (r) => ({
  id:       r.id,
  refNo:    r.refNo,
  date:     r.date,
  status:   r.status,
  type:     r.type,
  store:    r.store?.name || null,
  customer: r.customer?.name || null,
  vendor:   r.vendor?.name || null,
})

// Resolve a free-text term (reference number) to one stock return.
async function resolveReturn(search, user) {
  const term = (search || '').trim()
  if (!term) return { error: 'Provide a stock return reference number to identify it.' }

  const { returns } = await returnSvc().list({ search: term, limit: 10, organizationId: orgOf(user) })
  if (!returns.length) return { error: `No stock return matches "${term}".` }
  if (returns.length === 1) return { ret: returns[0] }

  const lc = term.toLowerCase()
  const exact = returns.filter((r) => r.refNo && r.refNo.toLowerCase() === lc)
  if (exact.length === 1) return { ret: exact[0] }

  const refs = returns.map((r) => r.refNo).join(', ')
  return { error: `Multiple stock returns match "${term}": ${refs}. Use the exact reference number.` }
}

const tools = [
  {
    name: 'list_stock_returns',
    kind: 'server',
    description: 'List or search stock returns (customer or vendor returns). Use when the user asks what stock '
      + 'returns exist or to find one by reference.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional reference-number filter.' },
        type:   { type: 'string', enum: TYPES, description: 'Optional return type filter.' },
        limit:  { type: 'number', description: 'Max rows to return (default 10).' },
      },
    },
    async handler(args, { user }) {
      const { total, returns } = await returnSvc().list({
        search: args.search || '',
        type:   args.type || '',
        limit:  Math.min(Math.max(Number(args.limit) || 10, 1), 50),
        organizationId: orgOf(user),
      })
      return {
        result: { total, returns: returns.map(slim) },
        action: { type: 'navigate', target: 'stock_returns_list', path: '/erp/stock-return', label: 'Stock Returns' },
      }
    },
  },

  {
    name: 'get_stock_return',
    kind: 'server',
    description: 'Look up a single stock return\'s full details (type, store, customer/vendor, line items) by '
      + 'reference number.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Reference number identifying the stock return.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { ret, error } = await resolveReturn(args.search, user)
      if (error) return { result: error }
      const full = await returnSvc().getById(ret.id)
      const items = (full.items || []).map((i) => ({
        product: i.product?.name || null,
        qty:     Number(i.qty || 0),
        notes:   i.notes || null,
      }))
      return {
        result: { ...slim(full), notes: full.notes || null, items },
        action: { type: 'navigate', target: 'stock_return_detail', path: `/erp/stock-return/${full.id}`, label: full.refNo },
      }
    },
  },
]

module.exports = { tools, navTargets, resolveReturn, slim }
