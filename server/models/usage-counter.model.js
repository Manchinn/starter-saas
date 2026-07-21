const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const UsageCounter = sequelize.define('UsageCounter', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  organizationId: { type: DataTypes.UUID, allowNull: false },
  metric: { type: DataTypes.STRING, allowNull: false },
  period: { type: DataTypes.STRING, allowNull: false, defaultValue: 'lifetime' },
  count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  indexes: [{ unique: true, fields: ['organizationId', 'metric', 'period'] }],
})

module.exports = UsageCounter
