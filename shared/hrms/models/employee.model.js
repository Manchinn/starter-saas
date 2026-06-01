const { DataTypes } = require('sequelize')
const sequelize = require('../../../server/config/database')
const { auditFields } = require('../../erp/model-fields')

const Employee = sequelize.define('Employee', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  employeeCode: { type: DataTypes.STRING(50), allowNull: true , comment: 'Employee Code (รหัสพนักงาน)'},
  firstName:    { type: DataTypes.STRING,     allowNull: false , comment: 'First Name (ชื่อ)'},
  lastName:     { type: DataTypes.STRING,     allowNull: false , comment: 'Last Name (นามสกุล)'},
  position:     { type: DataTypes.STRING,     allowNull: true , comment: 'Position (ตำแหน่ง)'},
  department:   { type: DataTypes.STRING,     allowNull: true , comment: 'Department (แผนก)'},
  phone:        { type: DataTypes.STRING,     allowNull: true , comment: 'Phone (โทรศัพท์)'},
  startDate:    { type: DataTypes.DATEONLY,   allowNull: true , comment: 'Start Date (วันที่เริ่มต้น)'},
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'terminated'),
    defaultValue: 'active',
    comment: 'Status (สถานะ)',
  },
  activeFrom: { type: DataTypes.DATEONLY, allowNull: true , comment: 'Active From (วันที่เริ่มใช้งาน)'},
  activeTo:   { type: DataTypes.DATEONLY, allowNull: true , comment: 'Active To (วันที่สิ้นสุด)'},
  userId:    { type: DataTypes.UUID, allowNull: true , comment: 'User (ผู้ใช้)'},  // linked User (login credential)
  ...auditFields,
})

module.exports = Employee
