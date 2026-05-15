const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const ReceivePaymentInvoice = sequelize.define('ReceivePaymentInvoice', {
  id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  receivePaymentId: { type: DataTypes.UUID, allowNull: false },
  invoiceId:        { type: DataTypes.UUID, allowNull: false },
  amount:           { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  organizationId:   { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'ReceivePaymentInvoices', timestamps: true })

module.exports = ReceivePaymentInvoice

