const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const Setting = sequelize.define('Setting', {
  id:     { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  key:    { type: DataTypes.STRING(100), allowNull: false },
  value:  { type: DataTypes.TEXT, allowNull: true },
  userId: { type: DataTypes.UUID, allowNull: true },
}, {
  indexes: [{ unique: true, fields: ['key', 'userId'] }],
})

module.exports = Setting
