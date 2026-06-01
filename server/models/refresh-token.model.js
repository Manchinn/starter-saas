const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const RefreshToken = sequelize.define('RefreshToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID (รหัส)',
  },
  token: {
    type: DataTypes.STRING(512),
    allowNull: false,
    unique: true,
    comment: 'Token (โทเค็น)',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'User (ผู้ใช้)',
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Expires At (หมดอายุเมื่อ)',
  },
  isRevoked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  userAgent: {
    type: DataTypes.STRING(512),
    allowNull: true,
    comment: 'User Agent (User Agent)',
  },
  ip: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  deviceLabel: {
    type: DataTypes.STRING(128),
    allowNull: true,
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last Used At (ใช้งานล่าสุด)',
  },
})

module.exports = RefreshToken
