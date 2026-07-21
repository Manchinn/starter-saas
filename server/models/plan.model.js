const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Plan = sequelize.define('Plan', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  currency: { type: DataTypes.STRING, allowNull: false, defaultValue: 'USD' },
  interval: { type: DataTypes.ENUM('month', 'year'), allowNull: false, defaultValue: 'month' },
  trialDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  features: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
  limits: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  isPublic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
})

module.exports = Plan
