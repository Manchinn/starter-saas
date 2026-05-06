const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const CustomerGroup = sequelize.define('CustomerGroup', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status:     { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
  activeFrom: { type: DataTypes.DATEONLY, allowNull: true },
  activeTo:   { type: DataTypes.DATEONLY, allowNull: true },
  organizationId: { type: DataTypes.UUID, allowNull: true },
  dataFlag:       { type: DataTypes.INTEGER, defaultValue: 1 },
  createdBy:      { type: DataTypes.UUID, allowNull: true },
  modifiedBy:     { type: DataTypes.UUID, allowNull: true },
})

module.exports = CustomerGroup
