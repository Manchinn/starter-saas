const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const Attachment = sequelize.define('Attachment', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  refType:        { type: DataTypes.STRING, allowNull: false },
  refId:          { type: DataTypes.UUID,   allowNull: false },
  originalName:   { type: DataTypes.STRING, allowNull: false },
  storedName:     { type: DataTypes.STRING, allowNull: false },
  mimeType:       { type: DataTypes.STRING, allowNull: true , comment: 'MIME Type (ประเภทไฟล์)'},
  size:           { type: DataTypes.INTEGER, allowNull: true },
  uploadedBy:     { type: DataTypes.UUID, allowNull: true },
  ...auditFields,
}, {
  tableName: 'attachments',
  indexes: [{ fields: ['refType', 'refId'] }],
})

module.exports = Attachment
