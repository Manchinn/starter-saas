const { DataTypes } = require('sequelize')
const sequelize = require('../../../server/config/database')
const { auditFields } = require('../../erp/model-fields')

const Department = sequelize.define('Department', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  name: { type: DataTypes.STRING, allowNull: false , comment: 'Name (ชื่อ)'},
  code: { type: DataTypes.STRING(50), allowNull: true , comment: 'Code (รหัส)'},
  description: { type: DataTypes.TEXT, allowNull: true , comment: 'Description (คำอธิบาย)'},
  isActive:   { type: DataTypes.BOOLEAN, defaultValue: true , comment: 'Active (ใช้งาน)'},
  activeFrom: { type: DataTypes.DATEONLY, allowNull: true , comment: 'Active From (วันที่เริ่มใช้งาน)'},
  activeTo:   { type: DataTypes.DATEONLY, allowNull: true , comment: 'Active To (วันที่สิ้นสุด)'},
  ...auditFields,
})

module.exports = Department
