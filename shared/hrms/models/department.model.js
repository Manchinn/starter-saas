const { DataTypes } = require('sequelize')
const sequelize = require('../../../server/config/database')
const { auditFields } = require('../../erp/model-fields')

const Department = sequelize.define('Department', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  code: { type: DataTypes.STRING(50), allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  isActive:   { type: DataTypes.BOOLEAN, defaultValue: true },
  activeFrom: { type: DataTypes.DATEONLY, allowNull: true },
  activeTo:   { type: DataTypes.DATEONLY, allowNull: true },
  ...auditFields,
})

module.exports = Department
