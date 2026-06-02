// AI tools for the Stock Balance module.
//
// Auto-discovered by shared/ai-agent/services/tools.js (which loads any
// ai-tools/index.js under shared/erp, including nested ones). Stock balance is a
// read-only report, so these are query-only tools.

const stockBalance = require('./stock-balance.ai-tools')

const tools = [
  ...stockBalance.tools,
]

const navTargets = {
  ...stockBalance.navTargets,
}

module.exports = { tools, navTargets }
