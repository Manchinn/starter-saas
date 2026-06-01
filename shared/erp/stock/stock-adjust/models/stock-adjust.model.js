const { DataTypes } = require('sequelize')
const sequelize = require('../../../../../server/config/database')
const { auditFields } = require('../../../model-fields')

const StockAdjust = sequelize.define('StockAdjust', {
  id:     { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  refNo:  { type: DataTypes.STRING, allowNull: false, unique: true , comment: 'Reference No. (เลขอ้างอิง)'},
  date:   { type: DataTypes.DATEONLY, allowNull: false , comment: 'Date (วันที่)'},
  reason: { type: DataTypes.STRING, allowNull: true , comment: 'Reason (เหตุผล)'},
  notes:  { type: DataTypes.TEXT, allowNull: true , comment: 'Notes (หมายเหตุ)'},
  storeId: { type: DataTypes.UUID, allowNull: true , comment: 'Store / Warehouse (คลังสินค้า)'},
  status:  { type: DataTypes.STRING, defaultValue: 'draft' , comment: 'Status (สถานะ)'},
  ...auditFields,
})

module.exports = StockAdjust
