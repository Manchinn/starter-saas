const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'e.g. users.edit, posts.delete',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  group: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'general',
    comment: 'Groups permissions in the UI (users, modules, roles, …)',
  },
})

module.exports = Permission
