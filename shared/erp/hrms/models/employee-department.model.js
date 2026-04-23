const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const EmployeeDepartment = sequelize.define('EmployeeDepartment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  employeeId: { type: DataTypes.UUID, allowNull: false },
  departmentId: { type: DataTypes.UUID, allowNull: false },
})

module.exports = EmployeeDepartment
