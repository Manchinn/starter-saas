// AI tools for the Stock Request (transfer) module.
//
// Auto-discovered by shared/ai-agent/services/tools.js (which loads any
// ai-tools/index.js under shared/erp, including nested ones). Stock transfers
// are stock-posting documents, so these are read-only lookups plus navigation.

const stockRequest = require('./stock-request.ai-tools')

const tools = [
  ...stockRequest.tools,
]

const navTargets = {
  ...stockRequest.navTargets,
}

module.exports = { tools, navTargets }
