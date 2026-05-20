const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const DeliveryOrder = sequelize.define('DeliveryOrder', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  refNo:          { type: DataTypes.STRING, allowNull: false },
  date:           { type: DataTypes.DATEONLY, allowNull: false },
  deliveryDate:   { type: DataTypes.DATEONLY, allowNull: true },
  orderId:        { type: DataTypes.UUID, allowNull: true },
  customerId:     { type: DataTypes.UUID, allowNull: true },

  // Legacy: kept for old rows; new code reads shippingAddress and falls back to this.
  address:        { type: DataTypes.TEXT, allowNull: true },

  // Sales-order parity
  referenceNumber: { type: DataTypes.STRING, allowNull: true },
  paymentTerms:    { type: DataTypes.STRING(20), allowNull: true },
  salespersonId:   { type: DataTypes.UUID, allowNull: true },
  shippingAddress: { type: DataTypes.TEXT, allowNull: true },
  billingAddress:  { type: DataTypes.TEXT, allowNull: true },

  notes:          { type: DataTypes.TEXT, allowNull: true },
  status:         { type: DataTypes.ENUM('draft', 'confirmed', 'shipped', 'delivered', 'cancelled'), defaultValue: 'draft' },
  organizationId: { type: DataTypes.UUID, allowNull: true },
  dataFlag:       { type: DataTypes.INTEGER, defaultValue: 1 },
  createdBy:      { type: DataTypes.UUID, allowNull: true },
  modifiedBy:     { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'DeliveryOrders', timestamps: true })

module.exports = DeliveryOrder
