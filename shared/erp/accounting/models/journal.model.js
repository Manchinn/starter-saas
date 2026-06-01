const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const Journal = sequelize.define('Journal', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  refNo:          { type: DataTypes.STRING, allowNull: false , comment: 'Reference No. (เลขอ้างอิง)'},
  date:           { type: DataTypes.DATEONLY, allowNull: false , comment: 'Date (วันที่)'},
  description:    { type: DataTypes.TEXT, allowNull: true , comment: 'Description (คำอธิบาย)'},
  totalDebit:     { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 , comment: 'Total Debit (เดบิตรวม)'},
  status:         { type: DataTypes.ENUM('draft', 'posted', 'voided'), defaultValue: 'draft' , comment: 'Status (สถานะ)'},
  sourceType:     { type: DataTypes.STRING, allowNull: true , comment: 'Source Type (ประเภทที่มา)'},
  sourceId:       { type: DataTypes.UUID, allowNull: true , comment: 'Source ID (รหัสที่มา)'},
  ...auditFields,
}, { tableName: 'Journals', timestamps: true })

module.exports = Journal

