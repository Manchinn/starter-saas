const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const MasterDataCategory = sequelize.define('MasterDataCategory', {
  id:          { type: DataTypes.UUID,    defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  slug:        { type: DataTypes.STRING,  allowNull: false, unique: true , comment: 'Slug (สลัก)'},
  name:        { type: DataTypes.STRING,  allowNull: false , comment: 'Name (ชื่อ)'},
  description: { type: DataTypes.TEXT,   allowNull: true , comment: 'Description (คำอธิบาย)'},
  isSystem:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false , comment: 'System Role (บทบาทระบบ)'},
  isActive:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true , comment: 'Active (ใช้งาน)'},
  ...auditFields,
}, { tableName: 'MasterDataCategories' })

module.exports = MasterDataCategory
