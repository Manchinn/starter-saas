const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const FiscalYear = sequelize.define('FiscalYear', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:           { type: DataTypes.STRING, allowNull: false },
  startDate:      { type: DataTypes.DATEONLY, allowNull: false },
  endDate:        { type: DataTypes.DATEONLY, allowNull: false },
  status:         { type: DataTypes.ENUM('open', 'closed'), defaultValue: 'open' },
  notes:          { type: DataTypes.TEXT, allowNull: true },
  ...auditFields,
}, { tableName: 'FiscalYears', timestamps: true })

module.exports = FiscalYear

