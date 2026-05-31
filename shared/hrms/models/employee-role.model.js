const { DataTypes } = require('sequelize')
const sequelize = require('../../../server/config/database')

// Join: an Employee can carry multiple HRMS roles.
const EmployeeRole = sequelize.define('EmployeeRole', {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  employeeId: { type: DataTypes.UUID, allowNull: false },
  hrmsRoleId: { type: DataTypes.UUID, allowNull: false },
}, { timestamps: false })

module.exports = EmployeeRole
