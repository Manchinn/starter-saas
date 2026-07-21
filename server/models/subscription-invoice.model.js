const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const SubscriptionInvoice = sequelize.define('SubscriptionInvoice', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  organizationId: { type: DataTypes.UUID, allowNull: false },
  planId: { type: DataTypes.UUID, allowNull: true },
  number: { type: DataTypes.STRING, allowNull: true },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  currency: { type: DataTypes.STRING, allowNull: false, defaultValue: 'USD' },
  status: { type: DataTypes.ENUM('open', 'paid', 'void'), allowNull: false, defaultValue: 'open' },
  periodStart: { type: DataTypes.DATE, allowNull: true },
  periodEnd: { type: DataTypes.DATE, allowNull: true },
  paidAt: { type: DataTypes.DATE, allowNull: true },
  provider: { type: DataTypes.STRING, allowNull: false, defaultValue: 'manual' },
  providerInvoiceId: { type: DataTypes.STRING, allowNull: true },
})

module.exports = SubscriptionInvoice
