const { DataTypes } = require('sequelize')
const sequelize = require('../../../../../server/config/database')
const { auditFields } = require('../../../model-fields')

const StockCount = sequelize.define('StockCount', {
  id:      { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  refNo:   { type: DataTypes.STRING, allowNull: false, unique: true , comment: 'Reference No. (เลขอ้างอิง)'},
  date:    { type: DataTypes.DATEONLY, allowNull: false , comment: 'Date (วันที่)'},
  storeId: { type: DataTypes.UUID, allowNull: false , comment: 'Store / Warehouse (คลังสินค้า)'},
  notes:   { type: DataTypes.TEXT, allowNull: true , comment: 'Notes (หมายเหตุ)'},
  status:  { type: DataTypes.STRING, defaultValue: 'draft' , comment: 'Status (สถานะ)'},
  movementLocked: { type: DataTypes.BOOLEAN, defaultValue: false },
  ...auditFields,
})

module.exports = StockCount
