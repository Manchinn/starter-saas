const { DataTypes } = require('sequelize')
const sequelize = require('../../../../../server/config/database')
const { auditFields } = require('../../../model-fields')

const StockReturnItem = sequelize.define('StockReturnItem', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  stockReturnId: { type: DataTypes.UUID, allowNull: false , comment: 'Stock Return (ใบคืนสต็อก)'},
  productId:     { type: DataTypes.UUID, allowNull: false , comment: 'Product (สินค้า)'},
  qty:           { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 , comment: 'Quantity (จำนวน)'},
  cost:          { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 , comment: 'Cost (ต้นทุน)'},
  batchId:       { type: DataTypes.STRING, allowNull: true , comment: 'Batch / Lot (ล็อต / แบตช์)'},
  expiryDate:    { type: DataTypes.DATEONLY, allowNull: true , comment: 'Expiry Date (วันหมดอายุ)'},
  reason:         { type: DataTypes.TEXT, allowNull: true , comment: 'Reason (เหตุผล)'},
  ...auditFields,
})

module.exports = StockReturnItem
