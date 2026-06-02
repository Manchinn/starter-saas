const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

/**
 * UsageCounter — metered usage per organization, per metric, per period.
 *
 * `period` is either a calendar bucket (`YYYY-MM`) for resettable monthly
 * quotas or the literal `lifetime` for cumulative ones. The unique index keeps
 * a single row per (org, metric, period) so increments are idempotent upserts.
 */
const UsageCounter = sequelize.define('UsageCounter', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID (รหัส)',
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Organization (องค์กร)',
  },
  metric: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Metric key, e.g. erp.invoices.monthly (ตัวชี้วัด)',
  },
  period: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'lifetime',
    comment: 'YYYY-MM bucket or "lifetime" (รอบ)',
  },
  count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Usage count (จำนวนการใช้งาน)',
  },
}, {
  indexes: [
    { unique: true, fields: ['organizationId', 'metric', 'period'] },
  ],
})

module.exports = UsageCounter
