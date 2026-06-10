const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')
const { recordFields } = require('../../shared/erp/model-fields')

/**
 * PlanChangeRequest — a tenant's request to move to a plan, awaiting admin
 * approval. Tenants can no longer self-activate a plan; they submit a request
 * which an admin approves (activating the subscription) or rejects. The row also
 * serves as the audit trail of plan-change transactions.
 */
const PlanChangeRequest = sequelize.define('PlanChangeRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID (รหัส)',
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Requesting organization (องค์กรที่ขอ)',
  },
  planId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Requested plan (แผนที่ขอ)',
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'canceled'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Status (สถานะ)',
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Requester note (หมายเหตุผู้ขอ)',
  },
  decidedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Admin who approved/rejected (ผู้อนุมัติ/ปฏิเสธ)',
  },
  decidedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When decided (วันที่ตัดสิน)',
  },
  decisionNote: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Admin decision note (หมายเหตุการตัดสิน)',
  },
  ...recordFields,
})

module.exports = PlanChangeRequest
