const { DataTypes } = require('sequelize')
const sequelize = require('../../../../../server/config/database')
const { auditFields } = require('../../../model-fields')

const StockAdjustItem = sequelize.define('StockAdjustItem', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  stockAdjustId: { type: DataTypes.UUID, allowNull: false , comment: 'Stock Adjustment (ใบปรับสต็อก)'},
  productId:     { type: DataTypes.UUID, allowNull: false , comment: 'Product (สินค้า)'},
  qty:           { type: DataTypes.INTEGER, allowNull: false , comment: 'Quantity (จำนวน)'},
  notes:          { type: DataTypes.STRING, allowNull: true , comment: 'Notes (หมายเหตุ)'},
  ...auditFields,
})

module.exports = StockAdjustItem
