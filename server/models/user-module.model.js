const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')
const { recordFields } = require('../../shared/erp/model-fields')

// Junction table: which modules each user has access to
const UserModule = sequelize.define('UserModule', {
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'User (ผู้ใช้)',
  },
  moduleId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Module (โมดูล)',
  },
  ...recordFields,
})

module.exports = UserModule
