const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

// Junction table: which modules each role grants access to
const RoleModule = sequelize.define('RoleModule', {
  roleId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  moduleId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  timestamps: false,
})

module.exports = RoleModule
