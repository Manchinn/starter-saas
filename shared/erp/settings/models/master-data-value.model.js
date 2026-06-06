const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const MasterDataValue = sequelize.define('MasterDataValue', {
  id:          { type: DataTypes.UUID,    defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  categoryId:  { type: DataTypes.UUID,    allowNull: false , comment: 'Category (หมวดหมู่)'},
  code:        { type: DataTypes.STRING,  allowNull: true , comment: 'Code (รหัส)'},
  name:        { type: DataTypes.STRING,  allowNull: false , comment: 'Name (ชื่อ)'},
  description: { type: DataTypes.TEXT,   allowNull: true , comment: 'Description (คำอธิบาย)'},
  dataValue:   { type: DataTypes.STRING,  allowNull: true , comment: 'Data Value (ค่าข้อมูล) — extra value, e.g. WHT rate %'},
  sortOrder:   { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  isActive:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true , comment: 'Active (ใช้งาน)'},
  ...auditFields,
}, { tableName: 'MasterDataValues' })

module.exports = MasterDataValue
