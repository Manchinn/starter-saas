// AI tools for the Alert module.
//
// Auto-discovered by shared/ai-agent/services/tools.js (which loads only this
// index.js). Tools are split per controller — one file each, mirroring
// controllers/ and services/ — and merged here.

const alert = require('./alert.ai-tools')

const tools = [
  ...alert.tools,
]

const navTargets = {
  ...alert.navTargets,
}

module.exports = { tools, navTargets }
