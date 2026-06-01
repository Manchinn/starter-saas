const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Module = sequelize.define('Module', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID (รหัส)',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Name (ชื่อ)',
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Slug (สลัก)',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description (คำอธิบาย)',
  },
  icon: {
    type: DataTypes.STRING,
    defaultValue: 'cube',
    comment: 'Icon (ไอคอน)',
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Order (ลำดับ)',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Active (ใช้งาน)',
  },
  isCore: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Core modules cannot be deactivated',
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Permissions (สิทธิ์) — List of permission strings this module provides',
  },
  meta: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Meta (ข้อมูลเพิ่มเติม) — Extra metadata (route, component path, etc.)',
  },
})

module.exports = Module
