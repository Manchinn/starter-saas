// AI tools for the quotation controller (mirrors quotation.controller.js +
// quotation.service.js).
//
// Quotations are line-item workflow documents (draft → sent → accepted /
// rejected → converted, with convert-to-order). Like the orders/invoices/
// purchasing modules, the agent gets read-only lookups + navigation only — no
// create/edit/status/convert tools. The user authors and progresses quotations
// on the (validating) document pages.

const navTargets = {
  quotations_list:   { path: '/erp/quotations',        label: 'Quotations' },
  quotations_create: { path: '/erp/quotations/create', label: 'New Quotation' },
}

const quotationSvc = () => require('../quotation.service')
const orgOf = (user) => user?.organizationId || user?.id || null

const STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'converted']

const slim = (q) => ({
  id:       q.id,
  refNo:    q.refNo,
  date:     q.quotationDate,
  status:   q.status,
  customer: q.customer?.name || null,
  total:    q.total != null ? Number(q.total) : null,
  currency: q.currency || null,
})

// Resolve a free-text term (reference number) to one quotation.
async function resolveQuotation(search, user) {
  const term = (search || '').trim()
  if (!term) return { error: 'Provide a quotation reference number to identify it.' }

  const { quotations } = await quotationSvc().list({ search: term, limit: 10, organizationId: orgOf(user) })
  if (!quotations.length) return { error: `No quotation matches "${term}".` }
  if (quotations.length === 1) return { quotation: quotations[0] }

  const lc = term.toLowerCase()
  const exact = quotations.filter((q) => q.refNo && q.refNo.toLowerCase() === lc)
  if (exact.length === 1) return { quotation: exact[0] }

  const refs = quotations.map((q) => q.refNo).join(', ')
  return { error: `Multiple quotations match "${term}": ${refs}. Use the exact reference number.` }
}

const tools = [
  {
    name: 'list_quotations',
    kind: 'server',
    description: 'List or search quotations. Use when the user asks what quotations exist or their status '
      + '(e.g. "draft quotations", "quotations for customer X").',
    parameters: {
      type: 'object',
      properties: {
        search:   { type: 'string', description: 'Optional reference-number / customer-name filter.' },
        status:   { type: 'string', enum: STATUSES, description: 'Optional status filter.' },
        dateFrom: { type: 'string', description: 'Only quotations on/after this ISO date (YYYY-MM-DD).' },
        dateTo:   { type: 'string', description: 'Only quotations on/before this ISO date (YYYY-MM-DD).' },
        limit:    { type: 'number', description: 'Max rows to return (default 10).' },
      },
    },
    async handler(args, { user }) {
      const { total, quotations } = await quotationSvc().list({
        search:   args.search || '',
        status:   args.status || '',
        dateFrom: args.dateFrom || '',
        dateTo:   args.dateTo || '',
        limit:    Math.min(Math.max(Number(args.limit) || 10, 1), 50),
        organizationId: orgOf(user),
      })
      return {
        result: { total, quotations: quotations.map(slim) },
        action: { type: 'navigate', target: 'quotations_list', path: '/erp/quotations', label: 'Quotations' },
      }
    },
  },

  {
    name: 'get_quotation',
    kind: 'server',
    description: 'Look up a single quotation\'s full details (header, customer, line items, totals) by '
      + 'reference number.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Reference number identifying the quotation.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { quotation, error } = await resolveQuotation(args.search, user)
      if (error) return { result: error }
      const q = await quotationSvc().getById(quotation.id, orgOf(user))
      const items = (q.items || []).map((i) => ({
        product:   i.product?.name || i.saleItem?.name || i.productName || null,
        qty:       Number(i.quantity || 0),
        unitPrice: Number(i.unitPrice || 0),
        total:     Number(i.total || 0),
      }))
      return {
        result: {
          ...slim(q),
          validUntil:  q.validUntil || null,
          salesperson: q.salesperson?.name || null,
          notes:       q.notes || null,
          subtotal:    q.subtotal != null ? Number(q.subtotal) : null,
          tax:         q.tax != null ? Number(q.tax) : null,
          items,
        },
        action: { type: 'navigate', target: 'quotation_detail', path: `/erp/quotations/${q.id}`, label: q.refNo },
      }
    },
  },
]

module.exports = { tools, navTargets, resolveQuotation, slim }
