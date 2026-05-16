const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const Attachment = sequelize.define('Attachment', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  refType:        { type: DataTypes.STRING, allowNull: false },
  refId:          { type: DataTypes.UUID,   allowNull: false },
  originalName:   { type: DataTypes.STRING, allowNull: false },
  storedName:     { type: DataTypes.STRING, allowNull: false },
  mimeType:       { type: DataTypes.STRING, allowNull: true },
  size:           { type: DataTypes.INTEGER, allowNull: true },
  uploadedBy:     { type: DataTypes.UUID, allowNull: true },
  organizationId: { type: DataTypes.UUID, allowNull: true },
  dataFlag:       { type: DataTypes.INTEGER, defaultValue: 1 },
}, {
  tableName: 'attachments',
  indexes: [{ fields: ['refType', 'refId'] }],
})

module.exports = Attachment
