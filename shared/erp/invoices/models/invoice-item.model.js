const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const InvoiceItem = sequelize.define('InvoiceItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  invoiceId:   { type: DataTypes.UUID, allowNull: false },
  // Sales-order parity: product/sale linkage + package parent-child + store
  saleItemId:    { type: DataTypes.UUID, allowNull: true },
  salePackageId: { type: DataTypes.UUID, allowNull: true },
  parentItemId:  { type: DataTypes.UUID, allowNull: true },
  productId:     { type: DataTypes.UUID, allowNull: true },
  storeId:       { type: DataTypes.UUID, allowNull: true },
  productName: { type: DataTypes.STRING, allowNull: false },
  // Snapshot of the source code (SaleItem.code / SalePackage.code / Product.sku)
  // captured at line-creation. Keeps the printed doc stable even if the source
  // entity is later renamed or deleted, and survives legacy items where the
  // ID associations weren't populated.
  itemCode:    { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.STRING, allowNull: true },
  quantity:    { type: DataTypes.DECIMAL(10, 3), allowNull: false, defaultValue: 1 },
  unitPrice:   { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  taxRate:     { type: DataTypes.DECIMAL(5, 2),  allowNull: false, defaultValue: 0 },
  taxAmount:   { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  total:       { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  ...auditFields,
}, {
  tableName: 'invoice_items',
})

module.exports = InvoiceItem
