const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  orderNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('draft', 'confirmed', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'draft',
  },
  orderDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  notes:          { type: DataTypes.TEXT, allowNull: true },
  currency:       { type: DataTypes.STRING(3), allowNull: true },
  exchangeRate:   { type: DataTypes.DECIMAL(20, 8), allowNull: false, defaultValue: 1 },

  // Customer's PO / internal reference number
  referenceNumber:      { type: DataTypes.STRING, allowNull: true },
  expectedDeliveryDate: { type: DataTypes.DATEONLY, allowNull: true },
  paymentTerms:         { type: DataTypes.STRING(20), allowNull: true },
  salespersonId:        { type: DataTypes.UUID, allowNull: true },
  shippingAddress:      { type: DataTypes.TEXT, allowNull: true },
  billingAddress:       { type: DataTypes.TEXT, allowNull: true },

  // Order-level discount applied before tax
  discountType:  { type: DataTypes.ENUM('percent', 'fixed'), allowNull: true },
  discountValue: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  discountAmount:{ type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  organizationId: { type: DataTypes.UUID, allowNull: true },
  dataFlag:       { type: DataTypes.INTEGER, defaultValue: 1 },
  createdBy:      { type: DataTypes.UUID, allowNull: true },
  modifiedBy:     { type: DataTypes.UUID, allowNull: true },
})

module.exports = Order
