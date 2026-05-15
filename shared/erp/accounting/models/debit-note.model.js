const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const DebitNote = sequelize.define('DebitNote', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  refNo:          { type: DataTypes.STRING, allowNull: false },
  date:           { type: DataTypes.DATEONLY, allowNull: false },
  customerId:     { type: DataTypes.UUID, allowNull: false },
  invoiceId:      { type: DataTypes.UUID, allowNull: true },
  reason:         { type: DataTypes.STRING(500), allowNull: false },
  amount:         { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  notes:          { type: DataTypes.TEXT, allowNull: true },
  status:         { type: DataTypes.ENUM('draft', 'issued', 'cancelled'), defaultValue: 'draft' },
  organizationId: { type: DataTypes.UUID, allowNull: true },
  dataFlag:       { type: DataTypes.INTEGER, defaultValue: 1 },
  createdBy:      { type: DataTypes.UUID, allowNull: true },
  modifiedBy:     { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'DebitNotes', timestamps: true })

module.exports = DebitNote

