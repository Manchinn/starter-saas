// AI tools for the Audit module.
//
// Auto-discovered by shared/ai-agent/services/tools.js (which loads only this
// index.js). The audit log is read-only, so this exposes query tools only.

const audit = require('./audit.ai-tools')

const tools = [
  ...audit.tools,
]

const navTargets = {
  ...audit.navTargets,
}

module.exports = { tools, navTargets }
