const { DataTypes } = require('sequelize')
const sequelize = require('../../../server/config/database')

const HrmsRolePermission = sequelize.define('HrmsRolePermission', {
  id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  hrmsRoleId:       { type: DataTypes.UUID, allowNull: false },
  hrmsPermissionId: { type: DataTypes.UUID, allowNull: false },
}, { timestamps: false })

module.exports = HrmsRolePermission
