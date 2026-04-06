const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const StockReturnItem = sequelize.define('StockReturnItem', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  stockReturnId: { type: DataTypes.UUID, allowNull: false },
  productId:     { type: DataTypes.UUID, allowNull: false },
  qty:           { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  cost:          { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
  reason:        { type: DataTypes.TEXT, allowNull: true },
})

module.exports = StockReturnItem
