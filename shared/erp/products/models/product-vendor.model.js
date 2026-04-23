const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const ProductVendor = sequelize.define('ProductVendor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  vendorId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, { timestamps: false })

module.exports = ProductVendor
