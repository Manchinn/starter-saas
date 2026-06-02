// AI tools for the Good Receive module.
//
// Auto-discovered by shared/ai-agent/services/tools.js (which loads any
// ai-tools/index.js under shared/erp, including nested ones). Good Receives are
// stock-posting documents, so these are read-only lookup tools plus navigation.

const goodReceive = require('./good-receive.ai-tools')

const tools = [
  ...goodReceive.tools,
]

const navTargets = {
  ...goodReceive.navTargets,
}

module.exports = { tools, navTargets }
