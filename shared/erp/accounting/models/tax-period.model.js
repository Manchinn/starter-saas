const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const TaxPeriod = sequelize.define('TaxPeriod', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:           { type: DataTypes.STRING, allowNull: false },
  startDate:      { type: DataTypes.DATEONLY, allowNull: false },
  endDate:        { type: DataTypes.DATEONLY, allowNull: false },
  status:         { type: DataTypes.ENUM('open', 'closed'), defaultValue: 'open' },
  notes:          { type: DataTypes.TEXT, allowNull: true },
  closedBy:       { type: DataTypes.UUID, allowNull: true },
  closedAt:       { type: DataTypes.DATE, allowNull: true },
  ...auditFields,
}, {
  tableName: 'tax_periods',
  indexes: [
    { fields: ['organizationId', 'startDate', 'endDate'] },
    { fields: ['organizationId', 'status'] },
  ],
})

module.exports = TaxPeriod
