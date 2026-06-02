const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

/**
 * Subscription — one row per organization (the top-level User).
 *
 * `provider` selects which billing gateway owns this subscription; `manual`
 * (the default) means an admin/owner assigns it directly, while `stripe` (or a
 * future adapter) syncs state from the gateway via the webhook endpoint.
 */
const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID (รหัส)',
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    comment: 'Organization (top-level User) this subscription belongs to (องค์กร)',
  },
  planId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Plan (แผน)',
  },
  status: {
    type: DataTypes.ENUM('trialing', 'active', 'past_due', 'canceled', 'expired'),
    allowNull: false,
    defaultValue: 'active',
    comment: 'Status (สถานะ)',
  },
  currentPeriodStart: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Current period start (วันเริ่มรอบปัจจุบัน)',
  },
  currentPeriodEnd: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Current period end (วันสิ้นสุดรอบปัจจุบัน)',
  },
  trialEndsAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Trial end (วันสิ้นสุดการทดลองใช้)',
  },
  cancelAtPeriodEnd: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Cancel when the current period ends (ยกเลิกเมื่อสิ้นสุดรอบ)',
  },
  canceledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the subscription was canceled (วันที่ยกเลิก)',
  },
  provider: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'manual',
    comment: 'Billing provider (ผู้ให้บริการชำระเงิน)',
  },
  providerCustomerId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Gateway customer id (รหัสลูกค้าในเกตเวย์)',
  },
  providerSubscriptionId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Gateway subscription id (รหัสการสมัครในเกตเวย์)',
  },
})

module.exports = Subscription
