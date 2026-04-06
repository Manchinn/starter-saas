const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const StockMovement = sequelize.define('StockMovement', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  productId:   { type: DataTypes.UUID, allowNull: false },
  type:        { type: DataTypes.STRING, allowNull: false }, // receive | adjust | sale
  qty:         { type: DataTypes.INTEGER, allowNull: false }, // positive=in, negative=out
  stockBefore: { type: DataTypes.INTEGER, allowNull: false },
  stockAfter:  { type: DataTypes.INTEGER, allowNull: false },
  refType:     { type: DataTypes.STRING, allowNull: true },  // GoodReceive | StockAdjust | Order
  refId:       { type: DataTypes.UUID, allowNull: true },
  storeId:     { type: DataTypes.UUID, allowNull: true },
  refNo:       { type: DataTypes.STRING, allowNull: true },
  notes:       { type: DataTypes.TEXT, allowNull: true },
})

module.exports = StockMovement
