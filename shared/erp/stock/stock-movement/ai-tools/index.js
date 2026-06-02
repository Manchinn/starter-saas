// AI tools for the Stock Movement module.
//
// Auto-discovered by shared/ai-agent/services/tools.js (which loads any
// ai-tools/index.js under shared/erp, including nested ones). Stock movement is
// a read-only ledger, so this is a query-only tool.

const stockMovement = require('./stock-movement.ai-tools')

const tools = [
  ...stockMovement.tools,
]

const navTargets = {
  ...stockMovement.navTargets,
}

module.exports = { tools, navTargets }
