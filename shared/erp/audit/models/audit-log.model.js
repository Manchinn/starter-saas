const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const AuditLog = sequelize.define('AuditLog', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  userId:         { type: DataTypes.UUID, allowNull: true , comment: 'User (ผู้ใช้)'},
  userEmail:      { type: DataTypes.STRING, allowNull: true },
  action:         { type: DataTypes.STRING, allowNull: false , comment: 'Action (การกระทำ)'},
  entityType:     { type: DataTypes.STRING, allowNull: false , comment: 'Entity Type (ประเภทเอนทิตี)'},
  entityId:       { type: DataTypes.UUID,   allowNull: true , comment: 'Entity ID (รหัสเอนทิตี)'},
  summary:        { type: DataTypes.JSON,   allowNull: true },
  ...auditFields,
}, {
  tableName: 'audit_logs',
  updatedAt: false,
  indexes: [
    { fields: ['entityType', 'entityId'] },
    { fields: ['userId'] },
    { fields: ['createdAt'] },
  ],
})

module.exports = AuditLog
