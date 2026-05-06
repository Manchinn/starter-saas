const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const MasterDataValue = sequelize.define('MasterDataValue', {
  id:          { type: DataTypes.UUID,    defaultValue: DataTypes.UUIDV4, primaryKey: true },
  categoryId:  { type: DataTypes.UUID,    allowNull: false },
  code:        { type: DataTypes.STRING,  allowNull: true },
  name:        { type: DataTypes.STRING,  allowNull: false },
  description: { type: DataTypes.TEXT,   allowNull: true },
  sortOrder:   { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  isActive:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  organizationId: { type: DataTypes.UUID, allowNull: true },
  dataFlag:   { type: DataTypes.INTEGER, defaultValue: 1 },
  createdBy:  { type: DataTypes.UUID, allowNull: true },
  modifiedBy: { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'MasterDataValues' })

module.exports = MasterDataValue
