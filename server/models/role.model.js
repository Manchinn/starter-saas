const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Role = sequelize.define('Role', {
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
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#6366f1',
    comment: 'Badge color hex',
  },
  isSystem: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'System roles cannot be deleted',
  },
})

module.exports = Role
