const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const ProductStore = sequelize.define('ProductStore', {
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  storeId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  indexes: [{ unique: true, fields: ['productId', 'storeId'] }],
})

module.exports = ProductStore
