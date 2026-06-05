const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')
const { recordFields } = require('../../shared/erp/model-fields')

const RolePermission = sequelize.define('RolePermission', {
  roleId: { type: DataTypes.UUID, allowNull: false , comment: 'Role (บทบาท)'},
  permissionId: { type: DataTypes.UUID, allowNull: false , comment: 'Permission (สิทธิ์)'},
  ...recordFields,
})

module.exports = RolePermission
