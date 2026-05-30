// AI tools for the Products module.
//
// Auto-discovered by shared/ai-agent/services/tools.js (which loads only this
// index.js). Tools are split per controller — one file each, mirroring
// controllers/ and services/ — and merged here.

const product = require('./product.ai-tools')
const productCategory = require('./product-category.ai-tools')

const tools = [
  ...product.tools,
  ...productCategory.tools,
]

const navTargets = {
  ...product.navTargets,
  ...productCategory.navTargets,
}

module.exports = { tools, navTargets }
