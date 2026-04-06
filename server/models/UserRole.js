const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const UserRole = sequelize.define('UserRole', {
  userId: { type: DataTypes.UUID, allowNull: false },
  roleId: { type: DataTypes.UUID, allowNull: false },
}, { timestamps: false })

module.exports = UserRole
