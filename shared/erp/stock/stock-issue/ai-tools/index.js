// AI tools for the Stock Issue module.
//
// Auto-discovered by shared/ai-agent/services/tools.js (which loads any
// ai-tools/index.js under shared/erp, including nested ones). Stock issues are
// stock-posting documents, so these are read-only lookups plus navigation.

const stockIssue = require('./stock-issue.ai-tools')

const tools = [
  ...stockIssue.tools,
]

const navTargets = {
  ...stockIssue.navTargets,
}

module.exports = { tools, navTargets }
