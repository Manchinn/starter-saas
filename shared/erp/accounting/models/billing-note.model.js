const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const BillingNote = sequelize.define('BillingNote', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  refNo:          { type: DataTypes.STRING, allowNull: false },
  date:           { type: DataTypes.DATEONLY, allowNull: false },
  dueDate:        { type: DataTypes.DATEONLY, allowNull: true },
  customerId:     { type: DataTypes.UUID, allowNull: false },
  notes:          { type: DataTypes.TEXT, allowNull: true },
  status:         { type: DataTypes.ENUM('draft', 'sent', 'paid', 'cancelled'), defaultValue: 'draft' },
  total:          { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  organizationId: { type: DataTypes.UUID, allowNull: true },
  dataFlag:       { type: DataTypes.INTEGER, defaultValue: 1 },
  createdBy:      { type: DataTypes.UUID, allowNull: true },
  modifiedBy:     { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'BillingNotes', timestamps: true })

module.exports = BillingNote

