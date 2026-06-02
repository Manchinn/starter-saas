// AI tools for the stock-adjust controller (mirrors stock-adjust.controller.js
// + stock-adjust.service.js).
//
// A stock adjustment is a stock-posting document: confirming it writes stock
// movements, updates product/store on-hand, and posts a GL true-up journal.
// Like the other stock/financial workflow documents, the agent gets read-only
// lookups + navigation only — no create/edit/confirm tools.

const navTargets = {
  stock_adjusts_list:   { path: '/erp/stock-adjust',        label: 'Stock Adjustments' },
  stock_adjusts_create: { path: '/erp/stock-adjust/create', label: 'New Stock Adjustment' },
}

const adjSvc = () => require('../stock-adjust.service')
const orgOf = (user) => user?.organizationId || user?.id || null

const slim = (a) => ({
  id:     a.id,
  refNo:  a.refNo,
  date:   a.date,
  status: a.status,
  reason: a.reason || null,
  store:  a.store?.name || null,
})

// Resolve a free-text term (reference number) to one stock adjustment.
async function resolveAdjust(search, user) {
  const term = (search || '').trim()
  if (!term) return { error: 'Provide a stock adjustment reference number to identify it.' }

  const { adjustments } = await adjSvc().list({ search: term, limit: 10, organizationId: orgOf(user) })
  if (!adjustments.length) return { error: `No stock adjustment matches "${term}".` }
  if (adjustments.length === 1) return { adjust: adjustments[0] }

  const lc = term.toLowerCase()
  const exact = adjustments.filter((a) => a.refNo && a.refNo.toLowerCase() === lc)
  if (exact.length === 1) return { adjust: exact[0] }

  const refs = adjustments.map((a) => a.refNo).join(', ')
  return { error: `Multiple stock adjustments match "${term}": ${refs}. Use the exact reference number.` }
}

const tools = [
  {
    name: 'list_stock_adjustments',
    kind: 'server',
    description: 'List or search stock adjustments. Use when the user asks what stock adjustments exist or to '
      + 'find one by reference or reason.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional reference-number / reason filter.' },
        limit:  { type: 'number', description: 'Max rows to return (default 10).' },
      },
    },
    async handler(args, { user }) {
      const { total, adjustments } = await adjSvc().list({
        search: args.search || '',
        limit:  Math.min(Math.max(Number(args.limit) || 10, 1), 50),
        organizationId: orgOf(user),
      })
      return {
        result: { total, adjustments: adjustments.map(slim) },
        action: { type: 'navigate', target: 'stock_adjusts_list', path: '/erp/stock-adjust', label: 'Stock Adjustments' },
      }
    },
  },

  {
    name: 'get_stock_adjustment',
    kind: 'server',
    description: 'Look up a single stock adjustment\'s full details (header, store, line items) by reference '
      + 'number. A positive line qty increases stock, a negative qty decreases it.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Reference number identifying the stock adjustment.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { adjust, error } = await resolveAdjust(args.search, user)
      if (error) return { result: error }
      const full = await adjSvc().getById(adjust.id)
      const items = (full.items || []).map((i) => ({
        product: i.product?.name || null,
        qty:     Number(i.qty || 0),
        notes:   i.notes || null,
      }))
      return {
        result: { ...slim(full), notes: full.notes || null, items },
        action: { type: 'navigate', target: 'stock_adjust_detail', path: `/erp/stock-adjust/${full.id}`, label: full.refNo },
      }
    },
  },
]

module.exports = { tools, navTargets, resolveAdjust, slim }
