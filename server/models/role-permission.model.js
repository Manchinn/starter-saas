const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const RolePermission = sequelize.define('RolePermission', {
  roleId: { type: DataTypes.UUID, allowNull: false , comment: 'Role (บทบาท)'},
  permissionId: { type: DataTypes.UUID, allowNull: false , comment: 'Permission (สิทธิ์)'},
}, { timestamps: false })

module.exports = RolePermission
