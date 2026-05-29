const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const Alert = sequelize.define('Alert', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  severity: {
    type: DataTypes.ENUM('info', 'success', 'warning', 'critical'),
    defaultValue: 'info',
  },
  // Targeting level — who the alert reaches.
  scope: {
    type: DataTypes.ENUM('global', 'module', 'department'),
    defaultValue: 'global',
    allowNull: false,
  },
  // Set when scope === 'module' — the installed module slug (erp, hrms, …).
  moduleSlug: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Set when scope === 'department' — references an HRMS Department id.
  departmentId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  // Distinguishes admin-authored alerts from ones emitted by app events.
  source: {
    type: DataTypes.ENUM('manual', 'system'),
    defaultValue: 'manual',
  },
  // Optional in-app route to open when the alert is clicked.
  link: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Optional auto-hide time; null = never expires.
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  organizationId: { type: DataTypes.UUID, allowNull: true },
  dataFlag:       { type: DataTypes.INTEGER, defaultValue: 1 },
  createdBy:      { type: DataTypes.UUID, allowNull: true },
  modifiedBy:     { type: DataTypes.UUID, allowNull: true },
})

module.exports = Alert
