// AI tools for the Pricing module.
//
// Auto-discovered by shared/ai-agent/services/tools.js (which loads only this
// index.js).

const pricing = require('./pricing.ai-tools')

const tools = [
  ...pricing.tools,
]

const navTargets = {
  ...pricing.navTargets,
}

module.exports = { tools, navTargets }
