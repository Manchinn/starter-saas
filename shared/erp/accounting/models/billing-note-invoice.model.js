const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const BillingNoteInvoice = sequelize.define('BillingNoteInvoice', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  billingNoteId:  { type: DataTypes.UUID, allowNull: false },
  invoiceId:      { type: DataTypes.UUID, allowNull: false },
  amount:         { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  organizationId: { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'BillingNoteInvoices', timestamps: true })

module.exports = BillingNoteInvoice

