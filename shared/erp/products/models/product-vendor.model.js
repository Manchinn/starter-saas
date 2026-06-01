const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const ProductVendor = sequelize.define('ProductVendor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID (รหัส)',
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Product (สินค้า)',
  },
  vendorId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Vendor (ผู้ขาย)',
  },
}, { timestamps: false })

module.exports = ProductVendor
