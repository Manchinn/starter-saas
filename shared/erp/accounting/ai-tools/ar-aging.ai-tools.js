// AI tools for the AR-aging controller (mirrors
// controllers/ar-aging.controller.js + services/ar-aging.service.js).
//
// Read-only: buckets outstanding (sent) customer invoices by how overdue they
// are. Returns the org-wide summary plus a per-customer breakdown.

const { orgOf } = require('./chart-of-account.ai-tools')

const navTargets = {
  ar_aging: { path: '/erp/accounting/ar-aging', label: 'AR Aging' },
}

const arAgingSvc = () => require('../services/ar-aging.service')

const tools = [
  {
    name: 'ar_aging_report',
    kind: 'server',
    description: 'Accounts Receivable aging — outstanding customer invoices bucketed by age (current, 1-30, 31-60, 61-90, 90+ days overdue), with an org summary and per-customer breakdown. Use for "AR aging", "who owes us money", or "overdue receivables".',
    parameters: {
      type: 'object',
      properties: {
        asOfDate: { type: 'string', description: 'As-of date (YYYY-MM-DD). Defaults to today.' },
      },
    },
    async handler(args, { user }) {
      const report = await arAgingSvc().getReport({
        asOfDate: args.asOfDate,
        organizationId: orgOf(user),
      })
      // Trim the verbose per-invoice lists; keep each customer's bucket summary.
      const customers = report.customers.map((c) => ({
        customer: c.customer?.name || 'Unknown',
        company:  c.customer?.company || null,
        summary:  c.summary,
      }))
      return {
        result: { asOfDate: report.asOfDate, summary: report.summary, customers },
        action: { type: 'navigate', target: 'ar_aging', path: '/erp/accounting/ar-aging', label: 'AR Aging' },
      }
    },
  },
]

module.exports = { tools, navTargets }
