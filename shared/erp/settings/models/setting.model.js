const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const Setting = sequelize.define('Setting', {
  id:     { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  key:    { type: DataTypes.STRING(100), allowNull: false , comment: 'Key (คีย์)'},
  value:  { type: DataTypes.TEXT, allowNull: true , comment: 'Value (ค่า)'},
  userId: { type: DataTypes.UUID, allowNull: true , comment: 'User (ผู้ใช้)'},
}, {
  indexes: [{ unique: true, fields: ['key', 'userId'] }],
})

module.exports = Setting
