const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const MasterDataCategory = sequelize.define('MasterDataCategory', {
  id:          { type: DataTypes.UUID,    defaultValue: DataTypes.UUIDV4, primaryKey: true },
  slug:        { type: DataTypes.STRING,  allowNull: false, unique: true },
  name:        { type: DataTypes.STRING,  allowNull: false },
  description: { type: DataTypes.TEXT,   allowNull: true },
  isSystem:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  isActive:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  ...auditFields,
}, { tableName: 'MasterDataCategories' })

module.exports = MasterDataCategory
