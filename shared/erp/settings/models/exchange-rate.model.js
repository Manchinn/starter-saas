const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const ExchangeRate = sequelize.define('ExchangeRate', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  currencyCode:   { type: DataTypes.STRING(3), allowNull: false },
  rate:           { type: DataTypes.DECIMAL(20, 8), allowNull: false },
  asOfDate:       { type: DataTypes.DATEONLY, allowNull: false },
  source:         { type: DataTypes.STRING, allowNull: true, defaultValue: 'manual' },
  notes:          { type: DataTypes.STRING, allowNull: true },
  organizationId: { type: DataTypes.UUID, allowNull: true },
  createdBy:      { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'exchange_rates',
  indexes: [
    { fields: ['organizationId', 'currencyCode', 'asOfDate'] },
  ],
})

module.exports = ExchangeRate
