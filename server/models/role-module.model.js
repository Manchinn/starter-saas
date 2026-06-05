const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')
const { recordFields } = require('../../shared/erp/model-fields')

// Junction table: which modules each role grants access to
const RoleModule = sequelize.define('RoleModule', {
  roleId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Role (บทบาท)',
  },
  moduleId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Module (โมดูล)',
  },
  ...recordFields,
})

module.exports = RoleModule
