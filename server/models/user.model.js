const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')
const bcrypt = require('bcryptjs')
const { recordFields } = require('../../shared/erp/model-fields')

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID (รหัส)',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Name (ชื่อ)',
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
    comment: 'Email (อีเมล)',
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Password (รหัสผ่าน)',
  },
  role: {
    type: DataTypes.ENUM('admin', 'user'),
    defaultValue: 'user',
    comment: 'Role (บทบาท)',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Active (ใช้งาน)',
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last Login At (เข้าสู่ระบบล่าสุด)',
  },
  defaultPage: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Default Page (หน้าเริ่มต้น)',
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Organization (องค์กร) — Link to parent Organization (User ID). If null, this user is the Organization itself.'
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Parent (ลำดับชั้นเหนือ) — Parent organization ID — enables org hierarchy (sub-organizations).'
  },
  // ── Organization profile (used only on top-level orgs; harmless on staff users) ──
  companyName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Company Name (ชื่อบริษัท) — Display name on customer-facing documents (invoices, sales orders). Falls back to `name`.',
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Address (ที่อยู่)',
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Phone (โทรศัพท์)',
  },
  taxId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Tax ID (เลขผู้เสียภาษี) — Tax / VAT / business registration number printed on documents.',
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Website (เว็บไซต์)',
  },
  logoPath: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Logo (โลโก้) — Relative path under uploads/logos/ — served via /uploads/logos/*',
  },
  emailVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Email Verified At (ยืนยันอีเมลเมื่อ)',
  },
  emailVerificationToken: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Email Verification Token (โทเค็นยืนยันอีเมล)',
  },
  emailVerificationExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Email Verification Expires At (โทเค็นยืนยันหมดอายุ)',
  },
  passwordResetToken: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Password Reset Token (โทเค็นรีเซ็ตรหัสผ่าน)',
  },
  passwordResetExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Password Reset Expires At (โทเค็นรีเซ็ตหมดอายุ)',
  },
  ...recordFields,
}, {
  hooks: {
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, 12)
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12)
      }
    },
  },
  defaultScope: {
    attributes: { exclude: ['password'] },
  },
  scopes: {
    withPassword: { attributes: {} },
  },
})

User.prototype.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password)
}

User.prototype.toJSON = function () {
  const values = { ...this.get() }
  delete values.password
  delete values.emailVerificationToken
  delete values.passwordResetToken
  return values
}

module.exports = User
