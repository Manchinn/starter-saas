const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const VendorBillItem = sequelize.define('VendorBillItem', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  billId:         { type: DataTypes.UUID, allowNull: false },
  productId:      { type: DataTypes.UUID, allowNull: true , comment: 'Product (สินค้า)'},
  description:    { type: DataTypes.STRING, allowNull: false , comment: 'Description (คำอธิบาย)'},
  quantity:       { type: DataTypes.DECIMAL(12, 4), allowNull: false, defaultValue: 1 , comment: 'Quantity (จำนวน)'},
  unitPrice:      { type: DataTypes.DECIMAL(15, 4), allowNull: false, defaultValue: 0 , comment: 'Unit Price (ราคาต่อหน่วย)'},
  total:          { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 , comment: 'Total (ยอดรวม)'},
  ...auditFields,
}, {
  tableName: 'vendor_bill_items',
})

module.exports = VendorBillItem
