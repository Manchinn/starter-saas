const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const PurchaseOrderItem = sequelize.define('PurchaseOrderItem', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  purchaseOrderId:{ type: DataTypes.UUID, allowNull: false , comment: 'Purchase Order (ใบสั่งซื้อ)'},
  productId:      { type: DataTypes.UUID, allowNull: true , comment: 'Product (สินค้า)'},
  description:    { type: DataTypes.STRING, allowNull: true , comment: 'Description (คำอธิบาย)'},
  qty:            { type: DataTypes.DECIMAL(12, 4), allowNull: false, defaultValue: 1 , comment: 'Quantity (จำนวน)'},
  unitPrice:      { type: DataTypes.DECIMAL(15, 4), allowNull: false, defaultValue: 0 , comment: 'Unit Price (ราคาต่อหน่วย)'},
  notes:          { type: DataTypes.TEXT, allowNull: true , comment: 'Notes (หมายเหตุ)'},
  ...auditFields,
}, { tableName: 'PurchaseOrderItems', timestamps: true })

module.exports = PurchaseOrderItem
