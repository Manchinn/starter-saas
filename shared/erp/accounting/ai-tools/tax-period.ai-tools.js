// AI tools for the tax-period controller (mirrors
// controllers/tax-period.controller.js + services/tax-period.service.js).
//
// Read-only: list VAT/tax periods and run a period's VAT report (output tax
// less input tax = net VAT payable). Opening/closing periods stays on the page.

const { orgOf } = require('./chart-of-account.ai-tools')

const navTargets = {
  tax_periods: { path: '/erp/accounting/tax-periods', label: 'Tax Periods' },
}

const taxPeriodSvc = () => require('../services/tax-period.service')

const slimPeriod = (p) => ({
  id:        p.id,
  name:      p.name,
  startDate: p.startDate,
  endDate:   p.endDate,
  status:    p.status,
})

// Resolve a free-text term (period name) to one tax period.
async function resolvePeriod(search, user) {
  const term = (search || '').trim()
  const periods = await taxPeriodSvc().list({ organizationId: orgOf(user) })
  if (!periods.length) return { error: 'No tax periods have been set up yet.' }
  if (!term) return { error: `Which tax period? Available: ${periods.map((p) => p.name).join(', ')}.` }

  const lc = term.toLowerCase()
  const matches = periods.filter((p) => String(p.name).toLowerCase().includes(lc))
  if (matches.length === 1) return { period: matches[0] }
  if (!matches.length) return { error: `No tax period matches "${term}". Available: ${periods.map((p) => p.name).join(', ')}.` }

  const exact = matches.filter((p) => String(p.name).toLowerCase() === lc)
  if (exact.length === 1) return { period: exact[0] }
  return { error: `Multiple tax periods match "${term}": ${matches.map((p) => p.name).join(', ')}. Be more specific.` }
}

const tools = [
  {
    name: 'list_tax_periods',
    kind: 'server',
    description: 'List VAT/tax periods and their open/closed status.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['open', 'closed'], description: 'Optional status filter.' },
      },
    },
    async handler(args, { user }) {
      const periods = await taxPeriodSvc().list({ status: args.status || undefined, organizationId: orgOf(user) })
      return {
        result: { total: periods.length, periods: periods.map(slimPeriod) },
        action: { type: 'navigate', target: 'tax_periods', path: '/erp/accounting/tax-periods', label: 'Tax Periods' },
      }
    },
  },

  {
    name: 'vat_report',
    kind: 'server',
    description: 'VAT report for a tax period (by name): output tax, input tax, net VAT payable.',
    parameters: {
      type: 'object',
      properties: {
        period: { type: 'string', description: 'Tax period name to report on.' },
      },
      required: ['period'],
    },
    async handler(args, { user }) {
      const { period, error } = await resolvePeriod(args.period, user)
      if (error) return { result: error }
      const report = await taxPeriodSvc().getVatReport(period.id, orgOf(user))
      return {
        result: {
          period:     slimPeriod(report.period),
          outputTax:  report.outputTax.total,
          inputTax:   report.inputTax.total,
          netPayable: report.netPayable,
          ...(report.message ? { note: report.message } : {}),
        },
        action: { type: 'navigate', target: 'tax_period_vat', path: `/erp/accounting/tax-periods/${period.id}/vat-report`, label: `VAT ${period.name}` },
      }
    },
  },
]

module.exports = { tools, navTargets, resolvePeriod, slimPeriod }
