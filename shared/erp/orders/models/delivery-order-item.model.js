const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const DeliveryOrderItem = sequelize.define('DeliveryOrderItem', {
  id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  deliveryOrderId:  { type: DataTypes.UUID, allowNull: false },
  productId:        { type: DataTypes.UUID, allowNull: true },
  // Source tracking so DOs created from a SO with packages remember provenance.
  saleItemId:       { type: DataTypes.UUID, allowNull: true },
  salePackageId:    { type: DataTypes.UUID, allowNull: true },
  storeId:          { type: DataTypes.UUID, allowNull: true },
  productName:      { type: DataTypes.STRING, allowNull: false },
  qty:              { type: DataTypes.DECIMAL(10, 3), allowNull: false, defaultValue: 1 },
  notes:            { type: DataTypes.TEXT, allowNull: true },
  ...auditFields,
}, { tableName: 'DeliveryOrderItems', timestamps: true })

module.exports = DeliveryOrderItem
