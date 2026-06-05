const { DataTypes } = require('sequelize')
const sequelize = require('../../../server/config/database')
const { recordFields } = require('../../erp/model-fields')

// Join: an Employee can carry multiple HRMS roles.
const EmployeeRole = sequelize.define('EmployeeRole', {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  employeeId: { type: DataTypes.UUID, allowNull: false , comment: 'Employee (พนักงาน)'},
  hrmsRoleId: { type: DataTypes.UUID, allowNull: false },
  ...recordFields,
})

module.exports = EmployeeRole
