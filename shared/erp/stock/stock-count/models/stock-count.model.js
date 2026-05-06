const { DataTypes } = require('sequelize')
const sequelize = require('../../../../../server/config/database')

const StockCount = sequelize.define('StockCount', {
  id:      { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  refNo:   { type: DataTypes.STRING, allowNull: false, unique: true },
  date:    { type: DataTypes.DATEONLY, allowNull: false },
  storeId: { type: DataTypes.UUID, allowNull: false },
  notes:   { type: DataTypes.TEXT, allowNull: true },
  status:  { type: DataTypes.STRING, defaultValue: 'draft' },
  movementLocked: { type: DataTypes.BOOLEAN, defaultValue: false },
  organizationId: { type: DataTypes.UUID, allowNull: true },
  dataFlag:   { type: DataTypes.INTEGER, defaultValue: 1 },
  createdBy:  { type: DataTypes.UUID, allowNull: true },
  modifiedBy: { type: DataTypes.UUID, allowNull: true },
})

module.exports = StockCount
