const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const MasterDataCategory = sequelize.define('MasterDataCategory', {
  id:          { type: DataTypes.UUID,    defaultValue: DataTypes.UUIDV4, primaryKey: true },
  slug:        { type: DataTypes.STRING,  allowNull: false, unique: true },
  name:        { type: DataTypes.STRING,  allowNull: false },
  description: { type: DataTypes.TEXT,   allowNull: true },
  isSystem:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  isActive:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  organizationId: { type: DataTypes.UUID, allowNull: true },
  dataFlag:   { type: DataTypes.INTEGER, defaultValue: 1 },
  createdBy:  { type: DataTypes.UUID, allowNull: true },
  modifiedBy: { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'MasterDataCategories' })

module.exports = MasterDataCategory
