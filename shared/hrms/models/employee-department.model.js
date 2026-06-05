const { DataTypes } = require('sequelize')
const sequelize = require('../../../server/config/database')
const { recordFields } = require('../../erp/model-fields')

const EmployeeDepartment = sequelize.define('EmployeeDepartment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  employeeId: { type: DataTypes.UUID, allowNull: false , comment: 'Employee (พนักงาน)'},
  departmentId: { type: DataTypes.UUID, allowNull: false , comment: 'Department (แผนก)'},
  ...recordFields,
})

module.exports = EmployeeDepartment
