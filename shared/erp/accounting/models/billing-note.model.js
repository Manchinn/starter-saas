const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const BillingNote = sequelize.define('BillingNote', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  refNo:          { type: DataTypes.STRING, allowNull: false },
  date:           { type: DataTypes.DATEONLY, allowNull: false },
  dueDate:        { type: DataTypes.DATEONLY, allowNull: true },
  customerId:     { type: DataTypes.UUID, allowNull: false },
  notes:          { type: DataTypes.TEXT, allowNull: true },
  status:         { type: DataTypes.ENUM('draft', 'sent', 'paid', 'cancelled'), defaultValue: 'draft' },
  total:          { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  currency:       { type: DataTypes.STRING(3), allowNull: true },
  exchangeRate:   { type: DataTypes.DECIMAL(20, 8), allowNull: false, defaultValue: 1 },
  ...auditFields,
}, { tableName: 'BillingNotes', timestamps: true })

module.exports = BillingNote

