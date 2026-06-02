// AI tools for the stock-count controller (mirrors stock-count.controller.js +
// stock-count.service.js).
//
// A stock count is a stock-posting document: confirming it sets store stock to
// the counted quantities and records variance movements (and a draft count can
// hold a movement lock on its store). Like the other stock workflow documents,
// the agent gets read-only lookups + navigation only — no create/edit/confirm/
// lock tools.

const navTargets = {
  stock_counts_list:   { path: '/erp/stock-count',        label: 'Stock Counts' },
  stock_counts_create: { path: '/erp/stock-count/create', label: 'New Stock Count' },
}

const countSvc = () => require('../stock-count.service')
const orgOf = (user) => user?.organizationId || user?.id || null

const slim = (c) => ({
  id:     c.id,
  refNo:  c.refNo,
  date:   c.date,
  status: c.status,
  store:  c.store?.name || null,
  locked: !!c.movementLocked,
})

// Resolve a free-text term (reference number) to one stock count.
async function resolveCount(search, user) {
  const term = (search || '').trim()
  if (!term) return { error: 'Provide a stock count reference number to identify it.' }

  const { counts } = await countSvc().list({ search: term, limit: 10, organizationId: orgOf(user) })
  if (!counts.length) return { error: `No stock count matches "${term}".` }
  if (counts.length === 1) return { count: counts[0] }

  const lc = term.toLowerCase()
  const exact = counts.filter((c) => c.refNo && c.refNo.toLowerCase() === lc)
  if (exact.length === 1) return { count: exact[0] }

  const refs = counts.map((c) => c.refNo).join(', ')
  return { error: `Multiple stock counts match "${term}": ${refs}. Use the exact reference number.` }
}

const tools = [
  {
    name: 'list_stock_counts',
    kind: 'server',
    description: 'List or search stock counts (physical inventory counts). Use when the user asks what stock '
      + 'counts exist or to find one by reference.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional reference-number filter.' },
        limit:  { type: 'number', description: 'Max rows to return (default 10).' },
      },
    },
    async handler(args, { user }) {
      const { total, counts } = await countSvc().list({
        search: args.search || '',
        limit:  Math.min(Math.max(Number(args.limit) || 10, 1), 50),
        organizationId: orgOf(user),
      })
      return {
        result: { total, counts: counts.map(slim) },
        action: { type: 'navigate', target: 'stock_counts_list', path: '/erp/stock-count', label: 'Stock Counts' },
      }
    },
  },

  {
    name: 'get_stock_count',
    kind: 'server',
    description: 'Look up a single stock count\'s full details by reference number, incl. per-line system vs '
      + 'counted quantity and the variance.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Reference number identifying the stock count.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { count, error } = await resolveCount(args.search, user)
      if (error) return { result: error }
      const full = await countSvc().getById(count.id)
      const items = (full.items || []).map((i) => {
        const systemQty  = Number(i.systemQty || 0)
        const countedQty = Number(i.countedQty || 0)
        return {
          product:    i.product?.name || null,
          systemQty,
          countedQty,
          variance:   Math.round((countedQty - systemQty) * 10000) / 10000,
        }
      })
      return {
        result: { ...slim(full), notes: full.notes || null, items },
        action: { type: 'navigate', target: 'stock_count_detail', path: `/erp/stock-count/${full.id}`, label: full.refNo },
      }
    },
  },
]

module.exports = { tools, navTargets, resolveCount, slim }
