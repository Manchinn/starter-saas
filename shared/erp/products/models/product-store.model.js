const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { recordFields } = require('../../model-fields')

const ProductStore = sequelize.define('ProductStore', {
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Product (สินค้า)',
  },
  storeId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Store / Warehouse (คลังสินค้า)',
  },
  ...recordFields,
}, {
  indexes: [{ unique: true, fields: ['productId', 'storeId'] }],
})

module.exports = ProductStore
