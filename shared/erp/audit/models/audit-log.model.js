const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const AuditLog = sequelize.define('AuditLog', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:         { type: DataTypes.UUID, allowNull: true },
  userEmail:      { type: DataTypes.STRING, allowNull: true },
  action:         { type: DataTypes.STRING, allowNull: false },
  entityType:     { type: DataTypes.STRING, allowNull: false },
  entityId:       { type: DataTypes.UUID,   allowNull: true },
  summary:        { type: DataTypes.JSON,   allowNull: true },
  organizationId: { type: DataTypes.UUID, allowNull: true },
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
