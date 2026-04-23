const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

// Junction table: which modules each user has access to
const UserModule = sequelize.define('UserModule', {
  userId: {
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

module.exports = UserModule
