const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const ProductCategory = sequelize.define('ProductCategory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
})

module.exports = ProductCategory
