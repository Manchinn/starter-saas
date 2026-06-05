const { DataTypes } = require('sequelize')
const sequelize = require('../../../server/config/database')
const { recordFields } = require('../../erp/model-fields')

const HrmsRolePermission = sequelize.define('HrmsRolePermission', {
  id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  hrmsRoleId:       { type: DataTypes.UUID, allowNull: false },
  hrmsPermissionId: { type: DataTypes.UUID, allowNull: false },
  ...recordFields,
})

module.exports = HrmsRolePermission
