const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const Currency = sequelize.define('Currency', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  code:           { type: DataTypes.STRING(3), allowNull: false , comment: 'Code (รหัส)'},
  name:           { type: DataTypes.STRING, allowNull: false , comment: 'Name (ชื่อ)'},
  symbol:         { type: DataTypes.STRING(8), allowNull: true , comment: 'Symbol (สัญลักษณ์)'},
  decimals:       { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
  isBase:         { type: DataTypes.BOOLEAN, defaultValue: false },
  isActive:       { type: DataTypes.BOOLEAN, defaultValue: true , comment: 'Active (ใช้งาน)'},
  ...auditFields,
}, {
  tableName: 'currencies',
  indexes: [
    { fields: ['organizationId', 'code'], unique: true },
  ],
})

module.exports = Currency
