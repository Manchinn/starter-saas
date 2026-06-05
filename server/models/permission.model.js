const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')
const { recordFields } = require('../../shared/erp/model-fields')

const Permission = sequelize.define('Permission', {
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
    comment: 'Slug (สลัก) — e.g. users.edit, posts.delete',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description (คำอธิบาย)',
  },
  group: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'general',
    comment: 'Group (กลุ่ม) — Groups permissions in the UI (users, modules, roles, …)',
  },
  ...recordFields,
})

module.exports = Permission
