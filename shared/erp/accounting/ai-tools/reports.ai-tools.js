// AI tools for the reports controller (mirrors
// controllers/reports.controller.js + services/{trial-balance,general-ledger}.service.js).
//
// Read-only financial reports built from POSTED journal lines. They return the
// figures for the model to narrate; per [[ai-agent-module]] the data-integrity
// directive forces the model to quote only these numbers, never invent them.

const { resolveAccount, orgOf } = require('./chart-of-account.ai-tools')

const navTargets = {
  trial_balance:   { path: '/erp/accounting/reports/trial-balance',   label: 'Trial Balance' },
  general_ledger:  { path: '/erp/accounting/reports/general-ledger',  label: 'General Ledger' },
}

const trialBalanceSvc  = () => require('../services/trial-balance.service')
const generalLedgerSvc = () => require('../services/general-ledger.service')

const tools = [
  {
    name: 'trial_balance_report',
    kind: 'server',
    description: 'Trial Balance: each account balance with debit/credit totals as of a date.',
    parameters: {
      type: 'object',
      properties: {
        asOfDate:    { type: 'string', description: 'As-of date (YYYY-MM-DD). Defaults to today.' },
        includeZero: { type: 'boolean', description: 'Include zero-balance accounts (default false).' },
      },
    },
    async handler(args, { user }) {
      const report = await trialBalanceSvc().getReport({
        asOfDate:    args.asOfDate,
        includeZero: args.includeZero === true,
        organizationId: orgOf(user),
      })
      return {
        result: report,
        action: { type: 'navigate', target: 'trial_balance', path: '/erp/accounting/reports/trial-balance', label: 'Trial Balance' },
      }
    },
  },

  {
    name: 'general_ledger_report',
    kind: 'server',
    description: 'General Ledger for one account (by code or name): opening balance, entries over a date range, closing balance.',
    parameters: {
      type: 'object',
      properties: {
        account:  { type: 'string', description: 'Account code or name to report on (required).' },
        fromDate: { type: 'string', description: 'Period start (YYYY-MM-DD). Optional.' },
        toDate:   { type: 'string', description: 'Period end (YYYY-MM-DD). Optional.' },
      },
      required: ['account'],
    },
    async handler(args, { user }) {
      const { account, error } = await resolveAccount(args.account, user)
      if (error) return { result: error }
      const report = await generalLedgerSvc().getReport({
        accountId: account.id,
        fromDate:  args.fromDate,
        toDate:    args.toDate,
        organizationId: orgOf(user),
      })
      return {
        result: report,
        action: { type: 'navigate', target: 'general_ledger', path: '/erp/accounting/reports/general-ledger', label: 'General Ledger' },
      }
    },
  },
]

module.exports = { tools, navTargets }
