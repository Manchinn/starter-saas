const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const StoreStock = sequelize.define('StoreStock', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  productId: { type: DataTypes.UUID, allowNull: false , comment: 'Product (สินค้า)'},
  storeId:   { type: DataTypes.UUID, allowNull: false , comment: 'Store / Warehouse (คลังสินค้า)'},
  stock:     { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 , comment: 'Stock (สต็อก)'},
}, {
  indexes: [{ unique: true, fields: ['productId', 'storeId'] }],
})

module.exports = StoreStock
