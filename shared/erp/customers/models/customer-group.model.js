const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const CustomerGroup = sequelize.define('CustomerGroup', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  },
})

module.exports = CustomerGroup
