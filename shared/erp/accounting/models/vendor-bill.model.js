const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const VendorBill = sequelize.define('VendorBill', {
  id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  billNumber:       { type: DataTypes.STRING, allowNull: false, unique: true },
  vendorId:         { type: DataTypes.UUID, allowNull: true },
  purchaseOrderId:  { type: DataTypes.UUID, allowNull: true },
  goodReceiveId:    { type: DataTypes.UUID, allowNull: true },
  vendorInvoiceNo:  { type: DataTypes.STRING, allowNull: true },
  billDate:         { type: DataTypes.DATEONLY, allowNull: false },
  dueDate:          { type: DataTypes.DATEONLY, allowNull: true },
  status:           { type: DataTypes.ENUM('draft', 'approved', 'paid', 'cancelled'), defaultValue: 'draft' },
  subtotal:         { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  tax:              { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  total:            { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  notes:            { type: DataTypes.TEXT, allowNull: true },
  currency:         { type: DataTypes.STRING(3), allowNull: true },
  exchangeRate:     { type: DataTypes.DECIMAL(20, 8), allowNull: false, defaultValue: 1 },
  ...auditFields,
}, {
  tableName: 'vendor_bills',
})

module.exports = VendorBill
