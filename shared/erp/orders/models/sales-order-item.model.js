const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const SalesOrderItem = sequelize.define('SalesOrderItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  itemId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  saleItemId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  storeId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  itemCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  taxRate:        { type: DataTypes.DECIMAL(5, 2),  allowNull: false, defaultValue: 0 },
  taxAmount:      { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  total:          { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  organizationId: { type: DataTypes.UUID, allowNull: true },
  dataFlag:       { type: DataTypes.INTEGER, defaultValue: 1 },
  createdBy:      { type: DataTypes.UUID, allowNull: true },
  modifiedBy:     { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'sales_order_items',
})

module.exports = SalesOrderItem
