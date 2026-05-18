const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const RefreshToken = sequelize.define('RefreshToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  token: {
    type: DataTypes.STRING(512),
    allowNull: false,
    unique: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  isRevoked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  userAgent: {
    type: DataTypes.STRING(512),
    allowNull: true,
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
  },
})

module.exports = RefreshToken
