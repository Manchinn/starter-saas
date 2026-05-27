const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const ReceivePayment = sequelize.define('ReceivePayment', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  refNo:         { type: DataTypes.STRING, allowNull: false },
  date:          { type: DataTypes.DATEONLY, allowNull: false },
  customerId:    { type: DataTypes.UUID, allowNull: false },
  paymentMethod: { type: DataTypes.STRING(100), allowNull: true },
  reference:      { type: DataTypes.STRING(200), allowNull: true },
  amount:         { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  currency:       { type: DataTypes.STRING(3), allowNull: true },
  exchangeRate:   { type: DataTypes.DECIMAL(20, 8), allowNull: false, defaultValue: 1 },
  notes:          { type: DataTypes.TEXT, allowNull: true },
  status:         { type: DataTypes.ENUM('draft', 'confirmed', 'cancelled'), defaultValue: 'draft' },
  organizationId: { type: DataTypes.UUID, allowNull: true },
  dataFlag:       { type: DataTypes.INTEGER, defaultValue: 1 },
  createdBy:      { type: DataTypes.UUID, allowNull: true },
  modifiedBy:     { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'ReceivePayments', timestamps: true })

module.exports = ReceivePayment

