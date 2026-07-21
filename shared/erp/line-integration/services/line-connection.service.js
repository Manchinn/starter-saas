const { LineConnection } = require('../../../../server/models')
const { encrypt } = require('./line.crypto')

const redact = (connection) => connection && {
  id: connection.id,
  organizationId: connection.organizationId,
  messagingChannelId: connection.messagingChannelId,
  botUserId: connection.botUserId,
  liffId: connection.liffId,
  liffChannelId: connection.liffChannelId,
  defaultStoreId: connection.defaultStoreId,
  isActive: connection.isActive,
  hasChannelSecret: Boolean(connection.channelSecretEncrypted),
  hasChannelAccessToken: Boolean(connection.channelAccessTokenEncrypted),
}

async function get(organizationId) {
  return redact(await LineConnection.findOne({ where: { organizationId } }))
}

async function save(organizationId, payload) {
  const required = ['messagingChannelId', 'botUserId', 'liffId', 'liffChannelId']
  for (const field of required) if (!String(payload[field] || '').trim()) throw { status: 400, message: `${field} is required` }
  const existing = await LineConnection.findOne({ where: { organizationId } })
  if (!existing && (!payload.channelSecret || !payload.channelAccessToken)) {
    throw { status: 400, message: 'channelSecret and channelAccessToken are required for a new connection' }
  }
  if (!payload.defaultStoreId) throw { status: 400, message: 'defaultStoreId is required for LINE ordering' }
  const store = await require('../../inventory/services/store.service').getById(payload.defaultStoreId, organizationId)
  if (store.status !== 'active') throw { status: 400, message: 'Default LINE store must be active' }
  const values = {
    messagingChannelId: payload.messagingChannelId.trim(),
    botUserId: payload.botUserId.trim(),
    liffId: payload.liffId.trim(),
    liffChannelId: payload.liffChannelId.trim(),
    defaultStoreId: payload.defaultStoreId || null,
    isActive: payload.isActive !== false,
  }
  if (payload.channelSecret) values.channelSecretEncrypted = encrypt(payload.channelSecret)
  if (payload.channelAccessToken) values.channelAccessTokenEncrypted = encrypt(payload.channelAccessToken)
  const connection = existing
    ? await existing.update(values)
    : await LineConnection.create({ organizationId, ...values })
  return redact(connection)
}

async function getPublicLiffConfig(organizationId) {
  const connection = await LineConnection.findOne({ where: { organizationId, isActive: true } })
  if (!connection) throw { status: 404, message: 'LINE ordering is not configured for this organization' }
  return { organizationId: connection.organizationId, liffId: connection.liffId }
}

module.exports = { get, save, getPublicLiffConfig }
