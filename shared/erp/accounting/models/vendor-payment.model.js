const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

// A disbursement to a vendor, allocated across one or more vendor bills.
// The payables mirror of ReceivePayment.
const VendorPayment = sequelize.define('VendorPayment', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  refNo:         { type: DataTypes.STRING, allowNull: false , comment: 'Reference No. (เลขอ้างอิง)'},
  date:          { type: DataTypes.DATEONLY, allowNull: false , comment: 'Date (วันที่)'},
  vendorId:      { type: DataTypes.UUID, allowNull: false , comment: 'Vendor (ผู้ขาย)'},
  paymentMethod: { type: DataTypes.STRING(100), allowNull: true , comment: 'Payment Method (วิธีการชำระ)'},
  reference:     { type: DataTypes.STRING(200), allowNull: true },
  amount:        { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 , comment: 'Amount (จำนวนเงิน)'},
  currency:      { type: DataTypes.STRING(3), allowNull: true , comment: 'Currency (สกุลเงิน)'},
  exchangeRate:  { type: DataTypes.DECIMAL(20, 8), allowNull: false, defaultValue: 1 , comment: 'Exchange Rate (อัตราแลกเปลี่ยน)'},
  notes:         { type: DataTypes.TEXT, allowNull: true , comment: 'Notes (หมายเหตุ)'},
  status:        { type: DataTypes.ENUM('draft', 'confirmed', 'cancelled'), defaultValue: 'draft' , comment: 'Status (สถานะ)'},
  ...auditFields,
}, { tableName: 'VendorPayments', timestamps: true })

module.exports = VendorPayment
