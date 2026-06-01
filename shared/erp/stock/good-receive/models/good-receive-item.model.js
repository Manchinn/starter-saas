const { DataTypes } = require('sequelize')
const sequelize = require('../../../../../server/config/database')
const { auditFields } = require('../../../model-fields')

const GoodReceiveItem = sequelize.define('GoodReceiveItem', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  goodReceiveId: { type: DataTypes.UUID, allowNull: false , comment: 'Good Receive (ใบรับสินค้า)'},
  productId:     { type: DataTypes.UUID, allowNull: false , comment: 'Product (สินค้า)'},

  qty:           { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 , comment: 'Quantity (จำนวน)'},
  qtyUomId:      { type: DataTypes.UUID, allowNull: true },

  freeQty:       { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
  freeQtyUomId:  { type: DataTypes.UUID, allowNull: true },

  batchId:       { type: DataTypes.STRING, allowNull: true , comment: 'Batch / Lot (ล็อต / แบตช์)'},
  expiryDate:    { type: DataTypes.DATEONLY, allowNull: true , comment: 'Expiry Date (วันหมดอายุ)'},

  cost:          { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 , comment: 'Cost (ต้นทุน)'},
  discount:      { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
  discountPct:   { type: DataTypes.DECIMAL(5, 2),  allowNull: true, defaultValue: 0 , comment: 'Discount (%) (ส่วนลด (%))'},
  netAmount:     { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
  wac:           { type: DataTypes.DECIMAL(10, 4), allowNull: true, defaultValue: 0 },

  stockQty:      { type: DataTypes.DECIMAL(12, 4), allowNull: true, defaultValue: 0 },

  comments:       { type: DataTypes.TEXT, allowNull: true },
  ...auditFields,
})

module.exports = GoodReceiveItem
