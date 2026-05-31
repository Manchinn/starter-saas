const { DataTypes } = require('sequelize')
const sequelize = require('../../../server/config/database')

// HRMS permission catalog. A read-only, system-wide registry of the assignable
// "functions" — seeded from the ERP, Reporting, AI Assistant and HRMS modules
// (see seeds/hrms-permissions.js). Grouped for display in the role editor.
const HrmsPermission = sequelize.define('HrmsPermission', {
  id:   { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true, comment: 'e.g. erp.customers.list' },
  description: { type: DataTypes.TEXT, allowNull: true },
  group:  { type: DataTypes.STRING, allowNull: false, defaultValue: 'general', comment: 'Buckets permissions in the UI' },
  module: { type: DataTypes.STRING, allowNull: false, defaultValue: 'general', comment: 'Source module slug (erp, reporting, ai-agent, hrms)' },
})

module.exports = HrmsPermission
