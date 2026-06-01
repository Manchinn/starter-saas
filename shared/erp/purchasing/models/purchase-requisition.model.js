const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const PurchaseRequisition = sequelize.define('PurchaseRequisition', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  refNo:          { type: DataTypes.STRING, allowNull: false , comment: 'Reference No. (เลขอ้างอิง)'},
  date:           { type: DataTypes.DATEONLY, allowNull: false , comment: 'Date (วันที่)'},
  requestedBy:    { type: DataTypes.STRING, allowNull: true , comment: 'Requested By (ผู้ขอ)'},
  department:     { type: DataTypes.STRING, allowNull: true , comment: 'Department (แผนก)'},
  vendorId:       { type: DataTypes.UUID, allowNull: true , comment: 'Vendor (ผู้ขาย)'},
  notes:          { type: DataTypes.TEXT, allowNull: true , comment: 'Notes (หมายเหตุ)'},
  status:         { type: DataTypes.ENUM('draft', 'approved', 'rejected'), defaultValue: 'draft' , comment: 'Status (สถานะ)'},
  currency:       { type: DataTypes.STRING(3), allowNull: true , comment: 'Currency (สกุลเงิน)'},
  exchangeRate:   { type: DataTypes.DECIMAL(20, 8), allowNull: false, defaultValue: 1 , comment: 'Exchange Rate (อัตราแลกเปลี่ยน)'},
  ...auditFields,
}, { tableName: 'PurchaseRequisitions', timestamps: true })

module.exports = PurchaseRequisition
