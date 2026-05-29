const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const ExchangeRate = sequelize.define('ExchangeRate', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  currencyCode:   { type: DataTypes.STRING(3), allowNull: false },
  rate:           { type: DataTypes.DECIMAL(20, 8), allowNull: false },
  asOfDate:       { type: DataTypes.DATEONLY, allowNull: false },
  source:         { type: DataTypes.STRING, allowNull: true, defaultValue: 'manual' },
  notes:          { type: DataTypes.STRING, allowNull: true },
  ...auditFields,
}, {
  tableName: 'exchange_rates',
  indexes: [
    { fields: ['organizationId', 'currencyCode', 'asOfDate'] },
  ],
})

module.exports = ExchangeRate
