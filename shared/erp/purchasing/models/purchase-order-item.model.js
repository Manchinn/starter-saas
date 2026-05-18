const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const PurchaseOrderItem = sequelize.define('PurchaseOrderItem', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  purchaseOrderId:{ type: DataTypes.UUID, allowNull: false },
  productId:      { type: DataTypes.UUID, allowNull: true },
  description:    { type: DataTypes.STRING, allowNull: true },
  qty:            { type: DataTypes.DECIMAL(12, 4), allowNull: false, defaultValue: 1 },
  unitPrice:      { type: DataTypes.DECIMAL(15, 4), allowNull: false, defaultValue: 0 },
  notes:          { type: DataTypes.TEXT, allowNull: true },
  organizationId: { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'PurchaseOrderItems', timestamps: true })

module.exports = PurchaseOrderItem
