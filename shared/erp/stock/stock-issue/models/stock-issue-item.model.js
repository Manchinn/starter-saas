const { DataTypes } = require('sequelize')
const sequelize = require('../../../../../server/config/database')
const { auditFields } = require('../../../model-fields')

const StockIssueItem = sequelize.define('StockIssueItem', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  stockIssueId: { type: DataTypes.UUID, allowNull: false , comment: 'Stock Issue (ใบเบิกสต็อก)'},
  productId:    { type: DataTypes.UUID, allowNull: false , comment: 'Product (สินค้า)'},
  qty:          { type: DataTypes.DECIMAL(10, 2), allowNull: false , comment: 'Quantity (จำนวน)'},
  batchId:      { type: DataTypes.STRING, allowNull: true , comment: 'Batch / Lot (ล็อต / แบตช์)'},
  expiryDate:   { type: DataTypes.DATEONLY, allowNull: true , comment: 'Expiry Date (วันหมดอายุ)'},
  notes:          { type: DataTypes.STRING, allowNull: true , comment: 'Notes (หมายเหตุ)'},
  ...auditFields,
})

module.exports = StockIssueItem
