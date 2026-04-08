const { DataTypes } = require('sequelize')
const sequelize = require('../../../../../server/config/database')

const StockAdjust = sequelize.define('StockAdjust', {
  id:     { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  refNo:  { type: DataTypes.STRING, allowNull: false, unique: true },
  date:   { type: DataTypes.DATEONLY, allowNull: false },
  reason: { type: DataTypes.STRING, allowNull: true },
  notes:  { type: DataTypes.TEXT, allowNull: true },
  storeId: { type: DataTypes.UUID, allowNull: true },
  status:  { type: DataTypes.STRING, defaultValue: 'draft' },
})

module.exports = StockAdjust
