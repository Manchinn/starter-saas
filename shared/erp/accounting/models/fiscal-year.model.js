const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const FiscalYear = sequelize.define('FiscalYear', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:           { type: DataTypes.STRING, allowNull: false },
  startDate:      { type: DataTypes.DATEONLY, allowNull: false },
  endDate:        { type: DataTypes.DATEONLY, allowNull: false },
  status:         { type: DataTypes.ENUM('open', 'closed'), defaultValue: 'open' },
  notes:          { type: DataTypes.TEXT, allowNull: true },
  organizationId: { type: DataTypes.UUID, allowNull: true },
  dataFlag:       { type: DataTypes.INTEGER, defaultValue: 1 },
  createdBy:      { type: DataTypes.UUID, allowNull: true },
  modifiedBy:     { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'FiscalYears', timestamps: true })

module.exports = FiscalYear

