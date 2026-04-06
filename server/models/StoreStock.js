const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const StoreStock = sequelize.define('StoreStock', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  productId: { type: DataTypes.UUID, allowNull: false },
  storeId:   { type: DataTypes.UUID, allowNull: false },
  stock:     { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  indexes: [{ unique: true, fields: ['productId', 'storeId'] }],
})

module.exports = StoreStock
