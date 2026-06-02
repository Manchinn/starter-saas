// AI tools for the Stock Return module.
//
// Auto-discovered by shared/ai-agent/services/tools.js (which loads any
// ai-tools/index.js under shared/erp, including nested ones). Stock returns are
// stock-posting documents, so these are read-only lookups plus navigation.

const stockReturn = require('./stock-return.ai-tools')

const tools = [
  ...stockReturn.tools,
]

const navTargets = {
  ...stockReturn.navTargets,
}

module.exports = { tools, navTargets }
