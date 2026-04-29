const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const Quotation = sequelize.define('Quotation', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  refNo: { type: DataTypes.STRING, allowNull: false, unique: true },
  customerId: { type: DataTypes.UUID, allowNull: true },
  quotationDate: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  validUntil: { type: DataTypes.DATEONLY, allowNull: true },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'accepted', 'rejected', 'converted'),
    defaultValue: 'draft',
  },
  subtotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  taxRate:  { type: DataTypes.DECIMAL(5, 2),  defaultValue: 0 },
  tax:      { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  total:    { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  notes:    { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'quotations' })

module.exports = Quotation
