const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const DeliveryOrder = sequelize.define('DeliveryOrder', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  refNo:          { type: DataTypes.STRING, allowNull: false },
  date:           { type: DataTypes.DATEONLY, allowNull: false },
  deliveryDate:   { type: DataTypes.DATEONLY, allowNull: true },
  orderId:        { type: DataTypes.UUID, allowNull: true },
  customerId:     { type: DataTypes.UUID, allowNull: true },
  address:        { type: DataTypes.TEXT, allowNull: true },
  notes:          { type: DataTypes.TEXT, allowNull: true },
  status:         { type: DataTypes.ENUM('draft', 'confirmed', 'shipped', 'delivered', 'cancelled'), defaultValue: 'draft' },
  organizationId: { type: DataTypes.UUID, allowNull: true },
  dataFlag:       { type: DataTypes.INTEGER, defaultValue: 1 },
  createdBy:      { type: DataTypes.UUID, allowNull: true },
  modifiedBy:     { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'DeliveryOrders', timestamps: true })

module.exports = DeliveryOrder
