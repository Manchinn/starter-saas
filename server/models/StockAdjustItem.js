const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const StockAdjustItem = sequelize.define('StockAdjustItem', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  stockAdjustId: { type: DataTypes.UUID, allowNull: false },
  productId:     { type: DataTypes.UUID, allowNull: false },
  qty:           { type: DataTypes.INTEGER, allowNull: false }, // positive = add, negative = remove
  notes:         { type: DataTypes.STRING, allowNull: true },
})

module.exports = StockAdjustItem
