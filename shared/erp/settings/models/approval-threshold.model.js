const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const ApprovalThreshold = sequelize.define('ApprovalThreshold', {
  id:                 { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  docType:            { type: DataTypes.ENUM('purchase_order', 'vendor_bill'), allowNull: false },
  amount:             { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 , comment: 'Amount (จำนวนเงิน)'},
  requiredPermission: { type: DataTypes.STRING, allowNull: false },
  notes:              { type: DataTypes.STRING, allowNull: true , comment: 'Notes (หมายเหตุ)'},
  ...auditFields,
}, {
  tableName: 'approval_thresholds',
})

module.exports = ApprovalThreshold
