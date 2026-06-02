// AI tools for the good-receive controller (mirrors good-receive.controller.js
// + good-receive.service.js).
//
// A Good Receive is a stock-posting document: confirming it writes stock
// movements, updates product/store stock, and can generate a vendor bill. Like
// the other stock/financial workflow documents, the agent gets read-only
// lookups + navigation only — no create/edit/confirm tools. The user receives
// and confirms goods on the (validating) document pages.

const navTargets = {
  good_receives_list:   { path: '/erp/good-receive',        label: 'Good Receives' },
  good_receives_create: { path: '/erp/good-receive/create', label: 'New Good Receive' },
}

const grSvc = () => require('../good-receive.service')
const orgOf = (user) => user?.organizationId || user?.id || null

const slim = (gr) => ({
  id:       gr.id,
  refNo:    gr.refNo,
  date:     gr.date,
  status:   gr.status,
  supplier: gr.supplier || null,
  store:    gr.store?.name || null,
  docType:  gr.docType || null,
})

// Resolve a free-text term (reference number) to one good receive.
async function resolveGoodReceive(search, user) {
  const term = (search || '').trim()
  if (!term) return { error: 'Provide a good receive reference number to identify it.' }

  const { goodReceives } = await grSvc().list({ search: term, limit: 10, organizationId: orgOf(user) })
  if (!goodReceives.length) return { error: `No good receive matches "${term}".` }
  if (goodReceives.length === 1) return { gr: goodReceives[0] }

  const lc = term.toLowerCase()
  const exact = goodReceives.filter((g) => g.refNo && g.refNo.toLowerCase() === lc)
  if (exact.length === 1) return { gr: exact[0] }

  const refs = goodReceives.map((g) => g.refNo).join(', ')
  return { error: `Multiple good receives match "${term}": ${refs}. Use the exact reference number.` }
}

const tools = [
  {
    name: 'list_good_receives',
    kind: 'server',
    description: 'List or search goods receipts (Good Receives). Use when the user asks what goods receipts '
      + 'exist or to find one by reference or supplier.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional reference-number / supplier filter.' },
        limit:  { type: 'number', description: 'Max rows to return (default 10).' },
      },
    },
    async handler(args, { user }) {
      const { total, goodReceives } = await grSvc().list({
        search: args.search || '',
        limit:  Math.min(Math.max(Number(args.limit) || 10, 1), 50),
        organizationId: orgOf(user),
      })
      return {
        result: { total, goodReceives: goodReceives.map(slim) },
        action: { type: 'navigate', target: 'good_receives_list', path: '/erp/good-receive', label: 'Good Receives' },
      }
    },
  },

  {
    name: 'get_good_receive',
    kind: 'server',
    description: 'Look up a single good receive\'s full details (header, store, line items, linked PO/bill) by '
      + 'reference number.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Reference number identifying the good receive.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { gr, error } = await resolveGoodReceive(args.search, user)
      if (error) return { result: error }
      const full = await grSvc().getById(gr.id)
      const items = (full.items || []).map((i) => ({
        product:   i.product?.name || null,
        qty:       Number(i.qty || 0),
        freeQty:   Number(i.freeQty || 0),
        cost:      Number(i.cost || 0),
        netAmount: Number(i.netAmount || 0),
      }))
      return {
        result: {
          ...slim(full),
          invoiceNo:     full.invoiceNo || null,
          purchaseOrder: full.purchaseOrder?.refNo || null,
          linkedBill:    full.linkedBill?.billNumber || null,
          notes:         full.notes || null,
          items,
        },
        action: { type: 'navigate', target: 'good_receive_detail', path: `/erp/good-receive/${full.id}`, label: full.refNo },
      }
    },
  },
]

module.exports = { tools, navTargets, resolveGoodReceive, slim }
