const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  reorderPoint: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  reorderQty: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'pcs',
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sellingUomId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  purchasingUomId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  },
  activeFrom: { type: DataTypes.DATEONLY, allowNull: true },
  activeTo:   { type: DataTypes.DATEONLY, allowNull: true },
  ...auditFields,
})

module.exports = Product
