const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const RolePermission = sequelize.define('RolePermission', {
  roleId: { type: DataTypes.UUID, allowNull: false },
  permissionId: { type: DataTypes.UUID, allowNull: false },
}, { timestamps: false })

module.exports = RolePermission
