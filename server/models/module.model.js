const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Module = sequelize.define('Module', {
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
  icon: {
    type: DataTypes.STRING,
    defaultValue: 'cube',
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isCore: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Core modules cannot be deactivated',
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'List of permission strings this module provides',
  },
  meta: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Extra metadata (route, component path, etc.)',
  },
})

module.exports = Module
