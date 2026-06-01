const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const ReceivePaymentInvoice = sequelize.define('ReceivePaymentInvoice', {
  id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  receivePaymentId: { type: DataTypes.UUID, allowNull: false , comment: 'Receive Payment (รายการรับชำระ)'},
  invoiceId:        { type: DataTypes.UUID, allowNull: false , comment: 'Invoice (ใบแจ้งหนี้)'},
  amount:           { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 , comment: 'Amount (จำนวนเงิน)'},
  ...auditFields,
}, { tableName: 'ReceivePaymentInvoices', timestamps: true })

module.exports = ReceivePaymentInvoice

