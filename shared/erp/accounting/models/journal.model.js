const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const Journal = sequelize.define('Journal', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  refNo:          { type: DataTypes.STRING, allowNull: false },
  date:           { type: DataTypes.DATEONLY, allowNull: false },
  description:    { type: DataTypes.TEXT, allowNull: true },
  totalDebit:     { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  status:         { type: DataTypes.ENUM('draft', 'posted', 'voided'), defaultValue: 'draft' },
  sourceType:     { type: DataTypes.STRING, allowNull: true },
  sourceId:       { type: DataTypes.UUID, allowNull: true },
  organizationId: { type: DataTypes.UUID, allowNull: true },
  dataFlag:       { type: DataTypes.INTEGER, defaultValue: 1 },
  createdBy:      { type: DataTypes.UUID, allowNull: true },
  modifiedBy:     { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'Journals', timestamps: true })

module.exports = Journal

