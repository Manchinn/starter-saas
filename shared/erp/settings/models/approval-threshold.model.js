const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const ApprovalThreshold = sequelize.define('ApprovalThreshold', {
  id:                 { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  docType:            { type: DataTypes.ENUM('purchase_order', 'vendor_bill'), allowNull: false },
  amount:             { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  requiredPermission: { type: DataTypes.STRING, allowNull: false },
  notes:              { type: DataTypes.STRING, allowNull: true },
  organizationId:     { type: DataTypes.UUID, allowNull: true },
  dataFlag:           { type: DataTypes.INTEGER, defaultValue: 1 },
  createdBy:          { type: DataTypes.UUID, allowNull: true },
  modifiedBy:         { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'approval_thresholds',
})

module.exports = ApprovalThreshold
