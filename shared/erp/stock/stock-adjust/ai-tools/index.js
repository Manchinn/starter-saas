// AI tools for the Stock Adjustment module.
//
// Auto-discovered by shared/ai-agent/services/tools.js (which loads any
// ai-tools/index.js under shared/erp, including nested ones). Stock adjustments
// are stock-posting documents, so these are read-only lookups plus navigation.

const stockAdjust = require('./stock-adjust.ai-tools')

const tools = [
  ...stockAdjust.tools,
]

const navTargets = {
  ...stockAdjust.navTargets,
}

module.exports = { tools, navTargets }
