const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const Currency = sequelize.define('Currency', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  code:           { type: DataTypes.STRING(3), allowNull: false },
  name:           { type: DataTypes.STRING, allowNull: false },
  symbol:         { type: DataTypes.STRING(8), allowNull: true },
  decimals:       { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
  isBase:         { type: DataTypes.BOOLEAN, defaultValue: false },
  isActive:       { type: DataTypes.BOOLEAN, defaultValue: true },
  organizationId: { type: DataTypes.UUID, allowNull: true },
  dataFlag:       { type: DataTypes.INTEGER, defaultValue: 1 },
  createdBy:      { type: DataTypes.UUID, allowNull: true },
  modifiedBy:     { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'currencies',
  indexes: [
    { fields: ['organizationId', 'code'], unique: true },
  ],
})

module.exports = Currency
