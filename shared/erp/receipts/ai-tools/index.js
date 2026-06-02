// AI tools for the Receipts module.
//
// Auto-discovered by shared/ai-agent/services/tools.js (which loads only this
// index.js). Receipts are financial workflow documents, so these are read-only
// lookup tools plus navigation — no create/edit/confirm/cancel.

const receipt = require('./receipt.ai-tools')

const tools = [
  ...receipt.tools,
]

const navTargets = {
  ...receipt.navTargets,
}

module.exports = { tools, navTargets }
