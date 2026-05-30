// AI tools for the Customers module.
//
// Auto-discovered by shared/ai-agent/services/tools.js (which loads only this
// index.js). Tools are split per controller — one file each, mirroring
// controllers/ and services/ — and merged here.

const customer = require('./customer.ai-tools')
const customerGroup = require('./customer-group.ai-tools')

const tools = [
  ...customer.tools,
  ...customerGroup.tools,
]

const navTargets = {
  ...customer.navTargets,
  ...customerGroup.navTargets,
}

module.exports = { tools, navTargets }
