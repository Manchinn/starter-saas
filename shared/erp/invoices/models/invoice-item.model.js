const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

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
  description: { type: DataTypes.STRING, allowNull: true },
  quantity:    { type: DataTypes.DECIMAL(10, 3), allowNull: false, defaultValue: 1 },
  unitPrice:   { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  taxRate:     { type: DataTypes.DECIMAL(5, 2),  allowNull: false, defaultValue: 0 },
  taxAmount:   { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  total:       { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  organizationId: { type: DataTypes.UUID, allowNull: true },
  dataFlag:   { type: DataTypes.INTEGER, defaultValue: 1 },
  createdBy:  { type: DataTypes.UUID, allowNull: true },
  modifiedBy: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'invoice_items',
})

module.exports = InvoiceItem
