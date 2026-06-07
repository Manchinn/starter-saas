const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

// One allocation line of a VendorPayment against a VendorBill.
const VendorPaymentBill = sequelize.define('VendorPaymentBill', {
  id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  vendorPaymentId: { type: DataTypes.UUID, allowNull: false , comment: 'Vendor Payment (รายการจ่ายชำระ)'},
  vendorBillId:    { type: DataTypes.UUID, allowNull: false , comment: 'Vendor Bill (ใบวางบิล)'},
  amount:          { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 , comment: 'Amount (จำนวนเงิน)'},
  ...auditFields,
}, { tableName: 'VendorPaymentBills', timestamps: true })

module.exports = VendorPaymentBill
