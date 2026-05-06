const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const QuotationItem = sequelize.define('QuotationItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  quotationId: { type: DataTypes.UUID, allowNull: false },
  saleItemId:  { type: DataTypes.UUID, allowNull: true },
  productId:   { type: DataTypes.UUID, allowNull: true },
  productName: { type: DataTypes.STRING, allowNull: false },
  qty:         { type: DataTypes.DECIMAL(10, 3), allowNull: false, defaultValue: 1 },
  unitPrice:   { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  discount:    { type: DataTypes.DECIMAL(5, 2),  defaultValue: 0 },
  total:       { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  notes:          { type: DataTypes.TEXT, allowNull: true },
  organizationId: { type: DataTypes.UUID, allowNull: true },
  dataFlag:       { type: DataTypes.INTEGER, defaultValue: 1 },
  createdBy:      { type: DataTypes.UUID, allowNull: true },
  modifiedBy:     { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'quotation_items' })

module.exports = QuotationItem
