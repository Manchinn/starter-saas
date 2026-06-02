// AI tools for the Sale module.
//
// Auto-discovered by shared/ai-agent/services/tools.js (which loads only this
// index.js). Tools are split per controller — one file each, mirroring
// controllers/ and services/ — and merged here.

const saleItem = require('./sale-item.ai-tools')
const salePackage = require('./sale-package.ai-tools')

const tools = [
  ...saleItem.tools,
  ...salePackage.tools,
]

const navTargets = {
  ...saleItem.navTargets,
  ...salePackage.navTargets,
}

module.exports = { tools, navTargets }
