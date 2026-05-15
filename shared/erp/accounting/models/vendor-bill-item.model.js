const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const VendorBillItem = sequelize.define('VendorBillItem', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  billId:         { type: DataTypes.UUID, allowNull: false },
  productId:      { type: DataTypes.UUID, allowNull: true },
  description:    { type: DataTypes.STRING, allowNull: false },
  quantity:       { type: DataTypes.DECIMAL(12, 4), allowNull: false, defaultValue: 1 },
  unitPrice:      { type: DataTypes.DECIMAL(15, 4), allowNull: false, defaultValue: 0 },
  total:          { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  organizationId: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'vendor_bill_items',
})

module.exports = VendorBillItem
