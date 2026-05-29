const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const Receipt = sequelize.define('Receipt', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  receiptNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  invoiceId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  receiptDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'bank_transfer', 'cheque', 'credit_card', 'other'),
    defaultValue: 'cash',
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  reference: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('draft', 'confirmed', 'cancelled'),
    defaultValue: 'draft',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  currency:       { type: DataTypes.STRING(3), allowNull: true },
  exchangeRate:   { type: DataTypes.DECIMAL(20, 8), allowNull: false, defaultValue: 1 },
  ...auditFields,
})

module.exports = Receipt
