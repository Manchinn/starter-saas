const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const StockCountItem = sequelize.define('StockCountItem', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  stockCountId: { type: DataTypes.UUID, allowNull: false },
  productId:    { type: DataTypes.UUID, allowNull: false },
  systemQty:    { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 }, // snapshot at time of count
  countedQty:   { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 }, // physically counted
})

module.exports = StockCountItem
