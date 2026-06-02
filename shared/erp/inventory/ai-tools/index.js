// AI tools for the Inventory module.
//
// Auto-discovered by shared/ai-agent/services/tools.js (which loads only this
// index.js). Tools are split per controller — one file each, mirroring
// controllers/ and services/ — and merged here.

const store = require('./store.ai-tools')
const uom = require('./uom.ai-tools')
const uomConversion = require('./uom-conversion.ai-tools')

const tools = [
  ...store.tools,
  ...uom.tools,
  ...uomConversion.tools,
]

const navTargets = {
  ...store.navTargets,
  ...uom.navTargets,
  ...uomConversion.navTargets,
}

module.exports = { tools, navTargets }
