const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

/**
 * SubscriptionInvoice — billing history for the SaaS subscription itself.
 *
 * Deliberately distinct from the ERP `Invoice` model (which is a tenant's own
 * customer-facing document). This records what the platform charged an
 * organization for its plan.
 */
const SubscriptionInvoice = sequelize.define('SubscriptionInvoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID (รหัส)',
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Organization (องค์กร)',
  },
  planId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Plan billed (แผนที่เรียกเก็บ)',
  },
  number: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Human-readable invoice number (เลขที่ใบแจ้งหนี้)',
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Amount (จำนวนเงิน)',
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'USD',
    comment: 'Currency (สกุลเงิน)',
  },
  status: {
    type: DataTypes.ENUM('open', 'paid', 'void'),
    allowNull: false,
    defaultValue: 'open',
    comment: 'Status (สถานะ)',
  },
  periodStart: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Billed period start (วันเริ่มรอบ)',
  },
  periodEnd: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Billed period end (วันสิ้นสุดรอบ)',
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When paid (วันที่ชำระ)',
  },
  provider: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'manual',
    comment: 'Billing provider (ผู้ให้บริการชำระเงิน)',
  },
  providerInvoiceId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Gateway invoice id (รหัสใบแจ้งหนี้ในเกตเวย์)',
  },
})

module.exports = SubscriptionInvoice
