// AI tools for the Purchasing module.
//
// Auto-discovered by shared/ai-agent/services/tools.js (which loads only this
// index.js). Tools are split per controller — one file each, mirroring
// controllers/ and services/ — and merged here.
//
// Purchasing documents (POs / requisitions) are line-item workflow records, so
// these are read-only lookup tools plus navigation — no create/edit/approve.

const purchaseOrder = require('./purchase-order.ai-tools')
const purchaseRequisition = require('./purchase-requisition.ai-tools')

const tools = [
  ...purchaseOrder.tools,
  ...purchaseRequisition.tools,
]

const navTargets = {
  ...purchaseOrder.navTargets,
  ...purchaseRequisition.navTargets,
}

module.exports = { tools, navTargets }
