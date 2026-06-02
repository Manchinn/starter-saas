// AI tools for the receipt controller (mirrors receipt.controller.js +
// receipt.service.js).
//
// Receipts are payment documents with financial side effects: confirming a
// receipt posts an accounting journal and applies the payment to the linked
// invoice; cancelling reverses both. Like the other financial/workflow
// documents (invoices, orders, purchasing, quotations), the agent gets
// read-only lookups + navigation only — no create/edit/confirm/cancel.

const navTargets = {
  receipts_list:   { path: '/erp/receipts',        label: 'Receipts' },
  receipts_create: { path: '/erp/receipts/create', label: 'New Receipt' },
}

const receiptSvc = () => require('../receipt.service')
const orgOf = (user) => user?.organizationId || user?.id || null

const STATUSES = ['draft', 'confirmed', 'cancelled']

const slim = (r) => ({
  id:            r.id,
  receiptNumber: r.receiptNumber,
  date:          r.receiptDate,
  status:        r.status,
  customer:      r.customer?.name || null,
  amount:        r.amount != null ? Number(r.amount) : null,
  paymentMethod: r.paymentMethod || null,
  currency:      r.currency || null,
})

// Resolve a free-text term (receipt number) to one receipt.
async function resolveReceipt(search, user) {
  const term = (search || '').trim()
  if (!term) return { error: 'Provide a receipt number to identify it.' }

  const { receipts } = await receiptSvc().list({ search: term, limit: 10, organizationId: orgOf(user) })
  if (!receipts.length) return { error: `No receipt matches "${term}".` }
  if (receipts.length === 1) return { receipt: receipts[0] }

  const lc = term.toLowerCase()
  const exact = receipts.filter((r) => r.receiptNumber && r.receiptNumber.toLowerCase() === lc)
  if (exact.length === 1) return { receipt: exact[0] }

  const nums = receipts.map((r) => r.receiptNumber).join(', ')
  return { error: `Multiple receipts match "${term}": ${nums}. Use the exact receipt number.` }
}

const tools = [
  {
    name: 'list_receipts',
    kind: 'server',
    description: 'List or search payment receipts. Use when the user asks what receipts exist or their '
      + 'status (e.g. "confirmed receipts", "receipts for customer X").',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional receipt-number filter.' },
        status: { type: 'string', enum: STATUSES, description: 'Optional status filter.' },
        limit:  { type: 'number', description: 'Max rows to return (default 10).' },
      },
    },
    async handler(args, { user }) {
      const { total, receipts } = await receiptSvc().list({
        search: args.search || '',
        status: args.status || '',
        limit:  Math.min(Math.max(Number(args.limit) || 10, 1), 50),
        organizationId: orgOf(user),
      })
      return {
        result: { total, receipts: receipts.map(slim) },
        action: { type: 'navigate', target: 'receipts_list', path: '/erp/receipts', label: 'Receipts' },
      }
    },
  },

  {
    name: 'get_receipt',
    kind: 'server',
    description: 'Look up a single receipt\'s full details (amount, payment method, customer, linked invoice) '
      + 'by receipt number.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Receipt number identifying the receipt.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { receipt, error } = await resolveReceipt(args.search, user)
      if (error) return { result: error }
      const r = await receiptSvc().getById(receipt.id, orgOf(user))
      return {
        result: {
          ...slim(r),
          invoice:   r.invoice?.invoiceNumber || null,
          reference: r.reference || null,
          notes:     r.notes || null,
        },
        action: { type: 'navigate', target: 'receipt_detail', path: `/erp/receipts/${r.id}`, label: r.receiptNumber },
      }
    },
  },
]

module.exports = { tools, navTargets, resolveReceipt, slim }
