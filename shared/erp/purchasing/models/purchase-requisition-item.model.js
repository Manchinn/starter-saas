const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const PurchaseRequisitionItem = sequelize.define('PurchaseRequisitionItem', {
  id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  requisitionId:   { type: DataTypes.UUID, allowNull: false , comment: 'Purchase Requisition (ใบขอซื้อ)'},
  productId:       { type: DataTypes.UUID, allowNull: true , comment: 'Product (สินค้า)'},
  description:     { type: DataTypes.STRING, allowNull: true , comment: 'Description (คำอธิบาย)'},
  qty:             { type: DataTypes.DECIMAL(12, 4), allowNull: false, defaultValue: 1 , comment: 'Quantity (จำนวน)'},
  unitPrice:       { type: DataTypes.DECIMAL(15, 4), allowNull: true , comment: 'Unit Price (ราคาต่อหน่วย)'},
  notes:           { type: DataTypes.TEXT, allowNull: true , comment: 'Notes (หมายเหตุ)'},
  ...auditFields,
}, { tableName: 'PurchaseRequisitionItems', timestamps: true })

module.exports = PurchaseRequisitionItem
