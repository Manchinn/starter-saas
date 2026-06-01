const { DataTypes } = require('sequelize')
const sequelize = require('../../../../../server/config/database')
const { auditFields } = require('../../../model-fields')

const StockRequestItem = sequelize.define('StockRequestItem', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  stockRequestId: { type: DataTypes.UUID, allowNull: false , comment: 'Stock Request (ใบขอเบิกสต็อก)'},
  productId:      { type: DataTypes.UUID, allowNull: false , comment: 'Product (สินค้า)'},
  qty:            { type: DataTypes.INTEGER, allowNull: false , comment: 'Quantity (จำนวน)'},
  notes:          { type: DataTypes.STRING, allowNull: true , comment: 'Notes (หมายเหตุ)'},
  ...auditFields,
})

module.exports = StockRequestItem
