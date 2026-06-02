// AI tools for the stock-request controller (mirrors stock-request.controller.js
// + stock-request.service.js).
//
// A stock request is a store-to-store transfer document: confirming it moves
// stock from the source store to the destination and records movements. Like
// the other stock workflow documents, the agent gets read-only lookups +
// navigation only — no create/edit/confirm tools.

const navTargets = {
  stock_requests_list:   { path: '/erp/stock-request',        label: 'Stock Transfers' },
  stock_requests_create: { path: '/erp/stock-request/create', label: 'New Stock Transfer' },
}

const requestSvc = () => require('../stock-request.service')
const orgOf = (user) => user?.organizationId || user?.id || null

const slim = (r) => ({
  id:        r.id,
  refNo:     r.refNo,
  date:      r.date,
  status:    r.status,
  fromStore: r.fromStore?.name || null,
  toStore:   r.toStore?.name || null,
})

// Resolve a free-text term (reference number) to one stock transfer.
async function resolveRequest(search, user) {
  const term = (search || '').trim()
  if (!term) return { error: 'Provide a stock transfer reference number to identify it.' }

  const { requests } = await requestSvc().list({ search: term, limit: 10, organizationId: orgOf(user) })
  if (!requests.length) return { error: `No stock transfer matches "${term}".` }
  if (requests.length === 1) return { request: requests[0] }

  const lc = term.toLowerCase()
  const exact = requests.filter((r) => r.refNo && r.refNo.toLowerCase() === lc)
  if (exact.length === 1) return { request: exact[0] }

  const refs = requests.map((r) => r.refNo).join(', ')
  return { error: `Multiple stock transfers match "${term}": ${refs}. Use the exact reference number.` }
}

const tools = [
  {
    name: 'list_stock_transfers',
    kind: 'server',
    description: 'List or search stock transfers (store-to-store stock requests). Use when the user asks what '
      + 'stock transfers exist or to find one by reference.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional reference-number / notes filter.' },
        limit:  { type: 'number', description: 'Max rows to return (default 10).' },
      },
    },
    async handler(args, { user }) {
      const { total, requests } = await requestSvc().list({
        search: args.search || '',
        limit:  Math.min(Math.max(Number(args.limit) || 10, 1), 50),
        organizationId: orgOf(user),
      })
      return {
        result: { total, transfers: requests.map(slim) },
        action: { type: 'navigate', target: 'stock_requests_list', path: '/erp/stock-request', label: 'Stock Transfers' },
      }
    },
  },

  {
    name: 'get_stock_transfer',
    kind: 'server',
    description: 'Look up a single stock transfer\'s full details (source/destination store, line items) by '
      + 'reference number.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Reference number identifying the stock transfer.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { request, error } = await resolveRequest(args.search, user)
      if (error) return { result: error }
      const full = await requestSvc().getById(request.id)
      const items = (full.items || []).map((i) => ({
        product: i.product?.name || null,
        qty:     Number(i.qty || 0),
        notes:   i.notes || null,
      }))
      return {
        result: { ...slim(full), notes: full.notes || null, items },
        action: { type: 'navigate', target: 'stock_request_detail', path: `/erp/stock-request/${full.id}`, label: full.refNo },
      }
    },
  },
]

module.exports = { tools, navTargets, resolveRequest, slim }
