const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const QuotationItem = sequelize.define('QuotationItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  quotationId:   { type: DataTypes.UUID, allowNull: false },
  saleItemId:    { type: DataTypes.UUID, allowNull: true },
  salePackageId: { type: DataTypes.UUID, allowNull: true },
  parentItemId:  { type: DataTypes.UUID, allowNull: true },
  productId:     { type: DataTypes.UUID, allowNull: true , comment: 'Product (สินค้า)'},
  storeId:       { type: DataTypes.UUID, allowNull: true , comment: 'Store / Warehouse (คลังสินค้า)'},
  productName:   { type: DataTypes.STRING, allowNull: false },

  // JS attribute `quantity` mirrors orders; DB column stays `qty` for compatibility.
  quantity:    { type: DataTypes.DECIMAL(10, 3), allowNull: false, defaultValue: 1, field: 'qty' , comment: 'Quantity (จำนวน)'},
  unitPrice:   { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 , comment: 'Unit Price (ราคาต่อหน่วย)'},
  discount:    { type: DataTypes.DECIMAL(5, 2),  defaultValue: 0 },
  taxRate:     { type: DataTypes.DECIMAL(5, 2),  allowNull: false, defaultValue: 0 , comment: 'Tax Rate (%) (อัตราภาษี (%))'},
  taxAmount:   { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  total:       { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 , comment: 'Total (ยอดรวม)'},
  notes:          { type: DataTypes.TEXT, allowNull: true , comment: 'Notes (หมายเหตุ)'},
  ...auditFields,
}, { tableName: 'quotation_items' })

module.exports = QuotationItem
