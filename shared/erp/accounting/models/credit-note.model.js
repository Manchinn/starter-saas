const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const CreditNote = sequelize.define('CreditNote', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  refNo:          { type: DataTypes.STRING, allowNull: false , comment: 'Reference No. (เลขอ้างอิง)'},
  date:           { type: DataTypes.DATEONLY, allowNull: false , comment: 'Date (วันที่)'},
  customerId:     { type: DataTypes.UUID, allowNull: false , comment: 'Customer (ลูกค้า)'},
  invoiceId:      { type: DataTypes.UUID, allowNull: true , comment: 'Invoice (ใบแจ้งหนี้)'},
  reason:         { type: DataTypes.STRING(500), allowNull: false , comment: 'Reason (เหตุผล)'},
  amount:         { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 , comment: 'Amount (จำนวนเงิน)'},
  notes:          { type: DataTypes.TEXT, allowNull: true , comment: 'Notes (หมายเหตุ)'},
  status:         { type: DataTypes.ENUM('draft', 'issued', 'cancelled'), defaultValue: 'draft' , comment: 'Status (สถานะ)'},
  ...auditFields,
}, { tableName: 'CreditNotes', timestamps: true })

module.exports = CreditNote

