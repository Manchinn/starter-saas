const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { recordFields } = require('../../model-fields')

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
  ...recordFields,
})

module.exports = ProductVendor
