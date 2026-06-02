const { DataTypes } = require('sequelize')

// The five record-keeping columns every table should carry: a soft-delete
// flag, who created / last modified the row, and the create / update
// timestamps. `createdAt` / `updatedAt` are declared explicitly (nullable) so
// they survive on models that would otherwise rely solely on Sequelize's
// implicit timestamps — and so the schema exporter documents them.
const recordFields = {
  dataFlag:   { type: DataTypes.INTEGER, defaultValue: 1, comment: 'Data Flag (สถานะข้อมูล) — 1 = active, 0 = soft-deleted' },
  createdBy:  { type: DataTypes.UUID, allowNull: true, comment: 'Created By (ผู้สร้าง) — User ID' },
  modifiedBy: { type: DataTypes.UUID, allowNull: true, comment: 'Modified By (ผู้แก้ไขล่าสุด) — User ID' },
  createdAt:  { type: DataTypes.DATE, allowNull: true, comment: 'Created At (วันที่สร้าง)' },
  updatedAt:  { type: DataTypes.DATE, allowNull: true, comment: 'Updated At (วันที่แก้ไขล่าสุด)' },
}

// Tenant-scoped entities additionally carry `organizationId`. Spread
// `auditFields` on those; spread `recordFields` on global/catalog tables that
// are not partitioned by organization.
const auditFields = {
  organizationId: { type: DataTypes.UUID, allowNull: true, comment: 'Organization (องค์กร) — owning tenant (User ID)' },
  ...recordFields,
}

module.exports = { auditFields, recordFields }
