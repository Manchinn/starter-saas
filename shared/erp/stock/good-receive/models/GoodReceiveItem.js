const { DataTypes } = require('sequelize')
const sequelize = require('../../../../../server/config/database')

const GoodReceiveItem = sequelize.define('GoodReceiveItem', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  goodReceiveId: { type: DataTypes.UUID, allowNull: false },
  productId:     { type: DataTypes.UUID, allowNull: false },

  qty:           { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  qtyUomId:      { type: DataTypes.UUID, allowNull: true },

  freeQty:       { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
  freeQtyUomId:  { type: DataTypes.UUID, allowNull: true },

  batchId:       { type: DataTypes.STRING, allowNull: true },
  expiryDate:    { type: DataTypes.DATEONLY, allowNull: true },

  cost:          { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
  discount:      { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
  discountPct:   { type: DataTypes.DECIMAL(5, 2),  allowNull: true, defaultValue: 0 },
  netAmount:     { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
  wac:           { type: DataTypes.DECIMAL(10, 4), allowNull: true, defaultValue: 0 },

  stockQty:      { type: DataTypes.DECIMAL(12, 4), allowNull: true, defaultValue: 0 },

  comments:      { type: DataTypes.TEXT, allowNull: true },
})

module.exports = GoodReceiveItem
