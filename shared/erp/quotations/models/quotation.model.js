const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const Quotation = sequelize.define('Quotation', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  refNo: { type: DataTypes.STRING, allowNull: false, unique: true },
  customerId: { type: DataTypes.UUID, allowNull: true },
  quotationDate: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  validUntil: { type: DataTypes.DATEONLY, allowNull: true },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'accepted', 'rejected', 'converted'),
    defaultValue: 'draft',
  },
  subtotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  taxRate:  { type: DataTypes.DECIMAL(5, 2),  defaultValue: 0 },
  tax:      { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  total:    { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  notes:          { type: DataTypes.TEXT, allowNull: true },
  currency:       { type: DataTypes.STRING(3), allowNull: true },
  exchangeRate:   { type: DataTypes.DECIMAL(20, 8), allowNull: false, defaultValue: 1 },

  // Sales-order parity: header-level extras
  referenceNumber: { type: DataTypes.STRING, allowNull: true },
  paymentTerms:    { type: DataTypes.STRING(20), allowNull: true },
  salespersonId:   { type: DataTypes.UUID, allowNull: true },
  shippingAddress: { type: DataTypes.TEXT, allowNull: true },
  billingAddress:  { type: DataTypes.TEXT, allowNull: true },

  // Order-level discount (applied to subtotal+tax)
  discountType:   { type: DataTypes.ENUM('percent', 'fixed'), allowNull: true },
  discountValue:  { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  discountAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },

  // Set when the quotation is converted to a Sales Order
  convertedToOrderId: { type: DataTypes.UUID, allowNull: true },

  ...auditFields,
}, { tableName: 'quotations' })

module.exports = Quotation
