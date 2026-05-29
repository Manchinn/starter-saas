const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const MasterDataValue = sequelize.define('MasterDataValue', {
  id:          { type: DataTypes.UUID,    defaultValue: DataTypes.UUIDV4, primaryKey: true },
  categoryId:  { type: DataTypes.UUID,    allowNull: false },
  code:        { type: DataTypes.STRING,  allowNull: true },
  name:        { type: DataTypes.STRING,  allowNull: false },
  description: { type: DataTypes.TEXT,   allowNull: true },
  sortOrder:   { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  isActive:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  ...auditFields,
}, { tableName: 'MasterDataValues' })

module.exports = MasterDataValue
