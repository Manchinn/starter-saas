const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

// The audit trail is append-only and grows without bound (designed for ~1M+
// rows), so its indexes are tuned for the actual read patterns rather than the
// generic registry rules. Every list query is organization-scoped and ordered
// by time, so each index leads with `organizationId` and ends with `createdAt`
// (and `id` as a monotonic tiebreaker) to serve keyset pagination from the
// index alone — no `COUNT(*)`, no filesort. See audit.service.list().
const AuditLog = sequelize.define('AuditLog', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  userId:         { type: DataTypes.UUID, allowNull: true , comment: 'User (ผู้ใช้)'},
  userEmail:      { type: DataTypes.STRING, allowNull: true },
  action:         { type: DataTypes.STRING, allowNull: false , comment: 'Action (การกระทำ)'},
  entityType:     { type: DataTypes.STRING, allowNull: false , comment: 'Entity Type (ประเภทเอนทิตี)'},
  entityId:       { type: DataTypes.UUID,   allowNull: true , comment: 'Entity ID (รหัสเอนทิตี)'},
  method:         { type: DataTypes.STRING, allowNull: true , comment: 'HTTP Method (เมธอด)'},
  ip:             { type: DataTypes.STRING, allowNull: true , comment: 'Client IP (ไอพี)'},
  summary:        { type: DataTypes.JSON,   allowNull: true },
  ...auditFields,
}, {
  tableName: 'audit_logs',
  updatedAt: false,
  indexes: [
    // Default org-scoped, time-ordered list + keyset pagination cursor.
    { name: 'audit_logs_org_created_id_idx', fields: ['organizationId', 'createdAt', 'id'] },
    // "History of one record."
    { name: 'audit_logs_org_entity_idx',     fields: ['organizationId', 'entityType', 'entityId', 'createdAt'] },
    // "Everything this user did."
    { name: 'audit_logs_org_user_idx',        fields: ['organizationId', 'userId', 'createdAt'] },
    // "Everything of this action type."
    { name: 'audit_logs_org_action_idx',      fields: ['organizationId', 'action', 'createdAt'] },
  ],
})

module.exports = AuditLog
