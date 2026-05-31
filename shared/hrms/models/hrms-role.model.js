const { DataTypes } = require('sequelize')
const sequelize = require('../../../server/config/database')
const { auditFields } = require('../../erp/model-fields')

// HRMS-local role. Independent from the platform-wide `Role` model: these roles
// are managed under HRMS, scoped per organisation, and attached to Employees.
const HrmsRole = sequelize.define('HrmsRole', {
  id:   { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, comment: 'Unique per organisation' },
  description: { type: DataTypes.TEXT, allowNull: true },
  color:    { type: DataTypes.STRING, defaultValue: '#6366f1', comment: 'Badge color hex' },
  isSystem: { type: DataTypes.BOOLEAN, defaultValue: false, comment: 'System roles cannot be deleted' },
  ...auditFields,
}, {
  indexes: [{ unique: true, fields: ['organizationId', 'slug'] }],
})

module.exports = HrmsRole
