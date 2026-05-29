const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const PurchaseRequisition = sequelize.define('PurchaseRequisition', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  refNo:          { type: DataTypes.STRING, allowNull: false },
  date:           { type: DataTypes.DATEONLY, allowNull: false },
  requestedBy:    { type: DataTypes.STRING, allowNull: true },
  department:     { type: DataTypes.STRING, allowNull: true },
  vendorId:       { type: DataTypes.UUID, allowNull: true },
  notes:          { type: DataTypes.TEXT, allowNull: true },
  status:         { type: DataTypes.ENUM('draft', 'approved', 'rejected'), defaultValue: 'draft' },
  currency:       { type: DataTypes.STRING(3), allowNull: true },
  exchangeRate:   { type: DataTypes.DECIMAL(20, 8), allowNull: false, defaultValue: 1 },
  ...auditFields,
}, { tableName: 'PurchaseRequisitions', timestamps: true })

module.exports = PurchaseRequisition
