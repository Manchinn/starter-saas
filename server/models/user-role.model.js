const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const UserRole = sequelize.define('UserRole', {
  userId: { type: DataTypes.UUID, allowNull: false , comment: 'User (ผู้ใช้)'},
  roleId: { type: DataTypes.UUID, allowNull: false , comment: 'Role (บทบาท)'},
}, { timestamps: false })

module.exports = UserRole
