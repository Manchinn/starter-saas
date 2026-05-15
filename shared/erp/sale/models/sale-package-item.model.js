const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const SalePackageItem = sequelize.define('SalePackageItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  packageId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  saleItemId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 1,
    allowNull: false,
  },
  unitPrice: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  notes: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'sale_package_items',
})

module.exports = SalePackageItem
