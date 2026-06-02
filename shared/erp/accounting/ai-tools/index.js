// AI tools for the Accounting module.
//
// Auto-discovered by shared/ai-agent/services/tools.js (which loads only this
// index.js). Tools are split per controller — one file each, mirroring
// controllers/ and services/ — and merged here.
//
// Accounting tools are READ-ONLY by design: the AI can look up accounts and
// journals and run financial reports (trial balance, general ledger, balance
// sheet, P&L, AR aging, VAT), but it never posts journals or edits the ledger —
// those require balanced entries and pass tax-period locks on the explicit
// pages. Each handler runs server-side with ctx = { user: { id, organizationId } }.

const chartOfAccount      = require('./chart-of-account.ai-tools')
const journal             = require('./journal.ai-tools')
const reports             = require('./reports.ai-tools')
const financialStatements = require('./financial-statements.ai-tools')
const arAging             = require('./ar-aging.ai-tools')
const taxPeriod           = require('./tax-period.ai-tools')
const documents           = require('./documents.ai-tools')

const tools = [
  ...chartOfAccount.tools,
  ...journal.tools,
  ...reports.tools,
  ...financialStatements.tools,
  ...arAging.tools,
  ...taxPeriod.tools,
  ...documents.tools,
]

const navTargets = {
  ...chartOfAccount.navTargets,
  ...journal.navTargets,
  ...reports.navTargets,
  ...financialStatements.navTargets,
  ...arAging.navTargets,
  ...taxPeriod.navTargets,
  ...documents.navTargets,
}

module.exports = { tools, navTargets }
