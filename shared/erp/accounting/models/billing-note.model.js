const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const BillingNote = sequelize.define('BillingNote', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  refNo:          { type: DataTypes.STRING, allowNull: false , comment: 'Reference No. (เลขอ้างอิง)'},
  date:           { type: DataTypes.DATEONLY, allowNull: false , comment: 'Date (วันที่)'},
  dueDate:        { type: DataTypes.DATEONLY, allowNull: true , comment: 'Due Date (วันครบกำหนด)'},
  customerId:     { type: DataTypes.UUID, allowNull: false , comment: 'Customer (ลูกค้า)'},
  notes:          { type: DataTypes.TEXT, allowNull: true , comment: 'Notes (หมายเหตุ)'},
  status:         { type: DataTypes.ENUM('draft', 'sent', 'paid', 'cancelled'), defaultValue: 'draft' , comment: 'Status (สถานะ)'},
  total:          { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 , comment: 'Total (ยอดรวม)'},
  currency:       { type: DataTypes.STRING(3), allowNull: true , comment: 'Currency (สกุลเงิน)'},
  exchangeRate:   { type: DataTypes.DECIMAL(20, 8), allowNull: false, defaultValue: 1 , comment: 'Exchange Rate (อัตราแลกเปลี่ยน)'},
  ...auditFields,
}, { tableName: 'BillingNotes', timestamps: true })

module.exports = BillingNote

