// AI tools for the Quotations module.
//
// Auto-discovered by shared/ai-agent/services/tools.js (which loads only this
// index.js). Quotations are line-item workflow documents, so these are
// read-only lookup tools plus navigation — no create/edit/status/convert.

const quotation = require('./quotation.ai-tools')

const tools = [
  ...quotation.tools,
]

const navTargets = {
  ...quotation.navTargets,
}

module.exports = { tools, navTargets }
