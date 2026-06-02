// AI tools for the purchase-requisition controller (mirrors
// controllers/purchase-requisition.controller.js +
// services/purchase-requisition.service.js).
//
// Like purchase orders, requisitions are line-item workflow documents
// (draft → approved/rejected), so the agent gets read-only lookups + navigation
// only — no create/edit/approve tools.

const navTargets = {
  purchase_requisitions_list:   { path: '/erp/purchasing/requisitions',        label: 'Purchase Requisitions' },
  purchase_requisitions_create: { path: '/erp/purchasing/requisitions/create', label: 'New Purchase Requisition' },
}

const prSvc = () => require('../services/purchase-requisition.service')
const orgOf = (user) => user?.organizationId || user?.id || null

const STATUSES = ['draft', 'approved', 'rejected']

const slim = (r) => ({
  id:          r.id,
  refNo:       r.refNo,
  date:        r.date,
  status:      r.status,
  requestedBy: r.requestedBy || null,
  department:  r.department || null,
  vendor:      r.vendor?.name || null,
})

const lineTotal = (i) => Number(i.qty || 0) * Number(i.unitPrice || 0)

// Resolve a free-text term (reference number) to one purchase requisition.
async function resolvePR(search, user) {
  const term = (search || '').trim()
  if (!term) return { error: 'Provide a purchase requisition reference number to identify it.' }

  const { requisitions } = await prSvc().list({ search: term, limit: 10, organizationId: orgOf(user) })
  if (!requisitions.length) return { error: `No purchase requisition matches "${term}".` }
  if (requisitions.length === 1) return { req: requisitions[0] }

  const lc = term.toLowerCase()
  const exact = requisitions.filter((r) => r.refNo && r.refNo.toLowerCase() === lc)
  if (exact.length === 1) return { req: exact[0] }

  const refs = requisitions.map((r) => r.refNo).join(', ')
  return { error: `Multiple purchase requisitions match "${term}": ${refs}. Use the exact reference number.` }
}

const tools = [
  {
    name: 'list_purchase_requisitions',
    kind: 'server',
    description: 'List or search purchase requisitions. Use when the user asks what requisitions exist or '
      + 'their status (e.g. "pending requisitions").',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional ref-number / requester / department filter.' },
        status: { type: 'string', enum: STATUSES, description: 'Optional status filter.' },
        limit:  { type: 'number', description: 'Max rows to return (default 10).' },
      },
    },
    async handler(args, { user }) {
      const { total, requisitions } = await prSvc().list({
        search: args.search || '',
        status: args.status || '',
        limit:  Math.min(Math.max(Number(args.limit) || 10, 1), 50),
        organizationId: orgOf(user),
      })
      return {
        result: { total, requisitions: requisitions.map(slim) },
        action: { type: 'navigate', target: 'purchase_requisitions_list', path: '/erp/purchasing/requisitions', label: 'Purchase Requisitions' },
      }
    },
  },

  {
    name: 'get_purchase_requisition',
    kind: 'server',
    description: 'Look up a single purchase requisition\'s full details (header, line items, total) by '
      + 'reference number.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Reference number identifying the purchase requisition.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { req, error } = await resolvePR(args.search, user)
      if (error) return { result: error }
      const pr = await prSvc().getById(req.id, orgOf(user))
      const items = (pr.items || []).map((i) => ({
        product:   i.product?.name || i.description || null,
        qty:       Number(i.qty || 0),
        unitPrice: Number(i.unitPrice || 0),
        lineTotal: lineTotal(i),
      }))
      return {
        result: {
          ...slim(pr),
          notes: pr.notes || null,
          items,
          total: items.reduce((s, i) => s + i.lineTotal, 0),
        },
        action: { type: 'navigate', target: 'purchase_requisition_detail', path: `/erp/purchasing/requisitions/${pr.id}`, label: pr.refNo },
      }
    },
  },
]

module.exports = { tools, navTargets, resolvePR, slim }
