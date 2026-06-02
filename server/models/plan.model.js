const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

/**
 * Plan — the subscription tier catalog (global, system-admin managed).
 *
 * `features` is a flag map gating access to functionality, e.g.
 *   { "erp.invoices": true, "ai-agent": false }
 * `limits` is a quota map enforced by server/middleware/plan.js, e.g.
 *   { "seats": 5, "erp.invoices.monthly": 100, "storageMb": 1024 }
 * A limit of -1 (or a missing key) is treated as unlimited.
 */
const Plan = sequelize.define('Plan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID (รหัส)',
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Slug (สลัก) — stable identifier, e.g. free / pro / enterprise',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Name (ชื่อ)',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description (คำอธิบาย)',
  },
  price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Price per interval (ราคา)',
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'USD',
    comment: 'Currency (สกุลเงิน)',
  },
  interval: {
    type: DataTypes.ENUM('month', 'year'),
    allowNull: false,
    defaultValue: 'month',
    comment: 'Billing interval (รอบการเรียกเก็บเงิน)',
  },
  trialDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Trial length in days (จำนวนวันทดลองใช้)',
  },
  features: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
    comment: 'Feature flag map (แผนผังฟีเจอร์)',
  },
  limits: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
    comment: 'Quota map; -1 or absent = unlimited (โควต้า)',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Active (ใช้งาน)',
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Show on the public pricing page (แสดงบนหน้าราคา)',
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Display order (ลำดับ)',
  },
})

module.exports = Plan
