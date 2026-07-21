const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

// One Messaging API / LIFF configuration belongs to one ERP organization.
// Sensitive values are AES-GCM ciphertext, never plaintext application data.
module.exports = sequelize.define('LineConnection', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  organizationId: { type: DataTypes.UUID, allowNull: false, unique: true },
  messagingChannelId: { type: DataTypes.STRING, allowNull: false },
  botUserId: { type: DataTypes.STRING, allowNull: false, unique: true },
  liffId: { type: DataTypes.STRING, allowNull: false },
  liffChannelId: { type: DataTypes.STRING, allowNull: false },
  defaultStoreId: { type: DataTypes.UUID, allowNull: true },
  channelSecretEncrypted: { type: DataTypes.TEXT, allowNull: false },
  channelAccessTokenEncrypted: { type: DataTypes.TEXT, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'line_connections', indexes: [{ unique: true, fields: ['organizationId'] }] })
