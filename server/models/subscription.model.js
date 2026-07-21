const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Subscription = sequelize.define('Subscription', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  organizationId: { type: DataTypes.UUID, allowNull: false, unique: true },
  planId: { type: DataTypes.UUID, allowNull: false },
  status: {
    type: DataTypes.ENUM('trialing', 'active', 'past_due', 'canceled', 'expired'),
    allowNull: false,
    defaultValue: 'active',
  },
  currentPeriodStart: { type: DataTypes.DATE, allowNull: true },
  currentPeriodEnd: { type: DataTypes.DATE, allowNull: true },
  trialEndsAt: { type: DataTypes.DATE, allowNull: true },
  cancelAtPeriodEnd: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  canceledAt: { type: DataTypes.DATE, allowNull: true },
  provider: { type: DataTypes.STRING, allowNull: false, defaultValue: 'manual' },
  providerCustomerId: { type: DataTypes.STRING, allowNull: true },
  providerSubscriptionId: { type: DataTypes.STRING, allowNull: true },
})

module.exports = Subscription
