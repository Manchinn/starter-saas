// AI tools for the stock-issue controller (mirrors stock-issue.controller.js +
// stock-issue.service.js).
//
// A stock issue is a stock-posting document: confirming it removes stock from
// the store and records issue movements. Like the other stock workflow
// documents, the agent gets read-only lookups + navigation only — no
// create/edit/confirm tools.

const navTargets = {
  stock_issues_list:   { path: '/erp/stock-issue',        label: 'Stock Issues' },
  stock_issues_create: { path: '/erp/stock-issue/create', label: 'New Stock Issue' },
}

const issueSvc = () => require('../stock-issue.service')
const orgOf = (user) => user?.organizationId || user?.id || null

const slim = (i) => ({
  id:     i.id,
  refNo:  i.refNo,
  date:   i.date,
  status: i.status,
  reason: i.reason || null,
  store:  i.store?.name || null,
})

// Resolve a free-text term (reference number) to one stock issue.
async function resolveIssue(search, user) {
  const term = (search || '').trim()
  if (!term) return { error: 'Provide a stock issue reference number to identify it.' }

  const { issues } = await issueSvc().list({ search: term, limit: 10, organizationId: orgOf(user) })
  if (!issues.length) return { error: `No stock issue matches "${term}".` }
  if (issues.length === 1) return { issue: issues[0] }

  const lc = term.toLowerCase()
  const exact = issues.filter((i) => i.refNo && i.refNo.toLowerCase() === lc)
  if (exact.length === 1) return { issue: exact[0] }

  const refs = issues.map((i) => i.refNo).join(', ')
  return { error: `Multiple stock issues match "${term}": ${refs}. Use the exact reference number.` }
}

const tools = [
  {
    name: 'list_stock_issues',
    kind: 'server',
    description: 'List or search stock issues (stock taken out of a store). Use when the user asks what stock '
      + 'issues exist or to find one by reference or reason.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional reference-number / reason filter.' },
        limit:  { type: 'number', description: 'Max rows to return (default 10).' },
      },
    },
    async handler(args, { user }) {
      const { total, issues } = await issueSvc().list({
        search: args.search || '',
        limit:  Math.min(Math.max(Number(args.limit) || 10, 1), 50),
        organizationId: orgOf(user),
      })
      return {
        result: { total, issues: issues.map(slim) },
        action: { type: 'navigate', target: 'stock_issues_list', path: '/erp/stock-issue', label: 'Stock Issues' },
      }
    },
  },

  {
    name: 'get_stock_issue',
    kind: 'server',
    description: 'Look up a single stock issue\'s full details (header, store, line items) by reference number.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Reference number identifying the stock issue.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { issue, error } = await resolveIssue(args.search, user)
      if (error) return { result: error }
      const full = await issueSvc().getById(issue.id)
      const items = (full.items || []).map((i) => ({
        product: i.product?.name || null,
        qty:     Number(i.qty || 0),
        notes:   i.notes || null,
      }))
      return {
        result: { ...slim(full), notes: full.notes || null, items },
        action: { type: 'navigate', target: 'stock_issue_detail', path: `/erp/stock-issue/${full.id}`, label: full.refNo },
      }
    },
  },
]

module.exports = { tools, navTargets, resolveIssue, slim }
