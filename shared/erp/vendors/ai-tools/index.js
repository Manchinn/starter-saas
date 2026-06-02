// AI tools for the Vendors module.
//
// Auto-discovered by shared/ai-agent/services/tools.js (which loads only this
// index.js).

const vendor = require('./vendor.ai-tools')

const tools = [
  ...vendor.tools,
]

const navTargets = {
  ...vendor.navTargets,
}

module.exports = { tools, navTargets }
