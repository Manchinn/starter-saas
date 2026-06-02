// AI tools for the Stock Count module.
//
// Auto-discovered by shared/ai-agent/services/tools.js (which loads any
// ai-tools/index.js under shared/erp, including nested ones). Stock counts are
// stock-posting documents, so these are read-only lookups plus navigation.

const stockCount = require('./stock-count.ai-tools')

const tools = [
  ...stockCount.tools,
]

const navTargets = {
  ...stockCount.navTargets,
}

module.exports = { tools, navTargets }
