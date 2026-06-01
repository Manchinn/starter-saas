const { DataTypes } = require('sequelize')
const sequelize = require('../../../../../server/config/database')
const { auditFields } = require('../../../model-fields')

const StockReturn = sequelize.define('StockReturn', {
  id:     { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  refNo:  { type: DataTypes.STRING, allowNull: false, unique: true , comment: 'Reference No. (เลขอ้างอิง)'},
  date:   { type: DataTypes.DATEONLY, allowNull: false , comment: 'Date (วันที่)'},
  type:   { type: DataTypes.STRING, allowNull: false, defaultValue: 'customer_return' , comment: 'Type (ประเภท)'},
  storeId:    { type: DataTypes.UUID, allowNull: true , comment: 'Store / Warehouse (คลังสินค้า)'},
  customerId: { type: DataTypes.UUID, allowNull: true , comment: 'Customer (ลูกค้า)'},
  vendorId:   { type: DataTypes.UUID, allowNull: true , comment: 'Vendor (ผู้ขาย)'},
  notes:  { type: DataTypes.TEXT, allowNull: true , comment: 'Notes (หมายเหตุ)'},
  status: { type: DataTypes.STRING, defaultValue: 'draft' , comment: 'Status (สถานะ)'},
  ...auditFields,
})

module.exports = StockReturn
