const { DataTypes } = require('sequelize')
const sequelize = require('../../../server/config/database')
const { auditFields } = require('../../erp/model-fields')

const Employee = sequelize.define('Employee', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  employeeCode: { type: DataTypes.STRING(50), allowNull: true },
  firstName:    { type: DataTypes.STRING,     allowNull: false },
  lastName:     { type: DataTypes.STRING,     allowNull: false },
  position:     { type: DataTypes.STRING,     allowNull: true },
  department:   { type: DataTypes.STRING,     allowNull: true },
  phone:        { type: DataTypes.STRING,     allowNull: true },
  startDate:    { type: DataTypes.DATEONLY,   allowNull: true },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'terminated'),
    defaultValue: 'active',
  },
  activeFrom: { type: DataTypes.DATEONLY, allowNull: true },
  activeTo:   { type: DataTypes.DATEONLY, allowNull: true },
  userId:    { type: DataTypes.UUID, allowNull: true },  // linked User (login credential)
  ...auditFields,
})

module.exports = Employee
