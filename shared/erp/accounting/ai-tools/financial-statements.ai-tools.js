// AI tools for the financial-statements controller (mirrors
// controllers/financial-statements.controller.js + services/financial-statements.service.js).
//
// Read-only TFRS-style statements. Balance Sheet is a snapshot at a date;
// Income Statement covers a [fromDate, toDate] period.

const { orgOf } = require('./chart-of-account.ai-tools')

const navTargets = {
  balance_sheet:     { path: '/erp/accounting/financial-statements/balance-sheet',     label: 'Balance Sheet' },
  income_statement:  { path: '/erp/accounting/financial-statements/income-statement',  label: 'Income Statement' },
  changes_in_equity: { path: '/erp/accounting/financial-statements/changes-in-equity', label: 'Changes in Equity' },
  financial_notes:   { path: '/erp/accounting/financial-statements/notes',             label: 'Notes to Financial Statements' },
}

const fsSvc = () => require('../services/financial-statements.service')

const tools = [
  {
    name: 'balance_sheet',
    kind: 'server',
    description: 'Statement of Financial Position (Balance Sheet) as of a date: assets, liabilities and equity with totals. Use for "balance sheet", "financial position", or "what are our assets/liabilities".',
    parameters: {
      type: 'object',
      properties: {
        asOfDate: { type: 'string', description: 'As-of date (YYYY-MM-DD). Defaults to today.' },
      },
    },
    async handler(args, { user }) {
      const asOfDate = (args.asOfDate || new Date().toISOString().slice(0, 10)).slice(0, 10)
      const report = await fsSvc().balanceSheet({ asOfDate, organizationId: orgOf(user) })
      return {
        result: report,
        action: { type: 'navigate', target: 'balance_sheet', path: '/erp/accounting/financial-statements/balance-sheet', label: 'Balance Sheet' },
      }
    },
  },

  {
    name: 'income_statement',
    kind: 'server',
    description: 'Income Statement (Profit & Loss) for a period: revenue, cost of sales, gross profit, expenses and net profit. Use for "P&L", "income statement", "profit", or "how much did we make".',
    parameters: {
      type: 'object',
      properties: {
        fromDate: { type: 'string', description: 'Period start (YYYY-MM-DD). Required.' },
        toDate:   { type: 'string', description: 'Period end (YYYY-MM-DD). Required.' },
      },
      required: ['fromDate', 'toDate'],
    },
    async handler(args, { user }) {
      if (!args.fromDate || !args.toDate) {
        return { result: 'Provide both a start (fromDate) and end (toDate) date for the income statement period.' }
      }
      const report = await fsSvc().incomeStatement({
        fromDate: args.fromDate.slice(0, 10),
        toDate:   args.toDate.slice(0, 10),
        organizationId: orgOf(user),
      })
      return {
        result: report,
        action: { type: 'navigate', target: 'income_statement', path: '/erp/accounting/financial-statements/income-statement', label: 'Income Statement' },
      }
    },
  },
]

module.exports = { tools, navTargets }
