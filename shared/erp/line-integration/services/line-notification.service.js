const { LineUserMapping, LineConnection } = require('../../../../server/models')
const { pushText } = require('./line-message.service')

// Delivery is deliberately best-effort: ERP state must never roll back because
// LINE has a transient outage or a user has blocked the bot.
async function notifyCustomer({ organizationId, customerId, text }) {
  if (!organizationId || !customerId) return
  const mapping = await LineUserMapping.findOne({
    where: { organizationId, customerId },
    include: [{ model: LineConnection, as: 'connection' }],
  })
  if (!mapping?.connection) return
  try { await pushText(mapping.connection, mapping.lineUserId, text) } catch (_) { /* best effort */ }
}

module.exports = { notifyCustomer }
