const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const BillingNoteInvoice = sequelize.define('BillingNoteInvoice', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  billingNoteId:  { type: DataTypes.UUID, allowNull: false , comment: 'Billing Note (ใบแจ้งยอด)'},
  invoiceId:      { type: DataTypes.UUID, allowNull: false , comment: 'Invoice (ใบแจ้งหนี้)'},
  amount:         { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 , comment: 'Amount (จำนวนเงิน)'},
  ...auditFields,
}, { tableName: 'BillingNoteInvoices', timestamps: true })

module.exports = BillingNoteInvoice

