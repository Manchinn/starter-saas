const { DataTypes } = require('sequelize')
const sequelize = require('../../../../../server/config/database')
const { auditFields } = require('../../../model-fields')

const StockMovement = sequelize.define('StockMovement', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  productId:   { type: DataTypes.UUID, allowNull: false , comment: 'Product (สินค้า)'},
  type:        { type: DataTypes.STRING, allowNull: false , comment: 'Type (ประเภท)'},
  qty:         { type: DataTypes.INTEGER, allowNull: false , comment: 'Quantity (จำนวน)'},
  stockBefore: { type: DataTypes.INTEGER, allowNull: false },
  stockAfter:  { type: DataTypes.INTEGER, allowNull: false },
  refType:     { type: DataTypes.STRING, allowNull: true },
  refId:       { type: DataTypes.UUID, allowNull: true },
  storeId:     { type: DataTypes.UUID, allowNull: true , comment: 'Store / Warehouse (คลังสินค้า)'},
  refNo:       { type: DataTypes.STRING, allowNull: true , comment: 'Reference No. (เลขอ้างอิง)'},
  notes:          { type: DataTypes.TEXT, allowNull: true , comment: 'Notes (หมายเหตุ)'},
  ...auditFields,
})

module.exports = StockMovement
