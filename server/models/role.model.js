const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')
const { recordFields } = require('../../shared/erp/model-fields')

const Role = sequelize.define('Role', {
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
  color: {
    type: DataTypes.STRING,
    defaultValue: '#6366f1',
    comment: 'Color (สี) — Badge color hex',
  },
  isSystem: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'System Role (บทบาทระบบ) — System roles cannot be deleted',
  },
  ...recordFields,
})

module.exports = Role
