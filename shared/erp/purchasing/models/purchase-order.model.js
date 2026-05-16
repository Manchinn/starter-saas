const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const PurchaseOrder = sequelize.define('PurchaseOrder', {
  id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  refNo:           { type: DataTypes.STRING, allowNull: false },
  date:            { type: DataTypes.DATEONLY, allowNull: false },
  deliveryDate:    { type: DataTypes.DATEONLY, allowNull: true },
  vendorId:        { type: DataTypes.UUID, allowNull: false },
  requisitionId:   { type: DataTypes.UUID, allowNull: true },
  notes:           { type: DataTypes.TEXT, allowNull: true },
  status:          { type: DataTypes.ENUM('draft', 'confirmed', 'received', 'cancelled'), defaultValue: 'draft' },
  currency:        { type: DataTypes.STRING(3), allowNull: true },
  exchangeRate:    { type: DataTypes.DECIMAL(20, 8), allowNull: false, defaultValue: 1 },
  organizationId:  { type: DataTypes.UUID, allowNull: true },
  dataFlag:        { type: DataTypes.INTEGER, defaultValue: 1 },
  createdBy:       { type: DataTypes.UUID, allowNull: true },
  modifiedBy:      { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'PurchaseOrders', timestamps: true })

module.exports = PurchaseOrder
