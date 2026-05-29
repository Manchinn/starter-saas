const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const Invoice = sequelize.define('Invoice', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  invoiceNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  customerId:      { type: DataTypes.UUID, allowNull: true },
  orderId:         { type: DataTypes.UUID, allowNull: true },
  deliveryOrderId: { type: DataTypes.UUID, allowNull: true },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'paid', 'cancelled'),
    defaultValue: 'draft',
  },
  invoiceDate: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  dueDate:     { type: DataTypes.DATEONLY, allowNull: true },
  subtotal:    { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  tax:         { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total:       { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  // Sum of all confirmed receive-payments, credit-notes, and other applications
  // against this invoice. balanceDue = total - amountPaid (virtual below).
  amountPaid:  { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  notes:        { type: DataTypes.TEXT, allowNull: true },
  currency:     { type: DataTypes.STRING(3), allowNull: true },
  exchangeRate: { type: DataTypes.DECIMAL(20, 8), allowNull: false, defaultValue: 1 },

  // Sales-order parity: header extras
  referenceNumber: { type: DataTypes.STRING, allowNull: true },
  paymentTerms:    { type: DataTypes.STRING(20), allowNull: true },
  salespersonId:   { type: DataTypes.UUID, allowNull: true },
  shippingAddress: { type: DataTypes.TEXT, allowNull: true },
  billingAddress:  { type: DataTypes.TEXT, allowNull: true },

  // Order-level discount applied to subtotal+tax
  discountType:   { type: DataTypes.ENUM('percent', 'fixed'), allowNull: true },
  discountValue:  { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  discountAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },

  ...auditFields,

  balanceDue: {
    type: DataTypes.VIRTUAL,
    get() {
      return Math.max(0, Number(this.getDataValue('total') || 0) - Number(this.getDataValue('amountPaid') || 0))
    },
  },
})

module.exports = Invoice
