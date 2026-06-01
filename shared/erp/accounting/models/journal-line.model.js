const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const JournalLine = sequelize.define('JournalLine', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  journalId:      { type: DataTypes.UUID, allowNull: false , comment: 'Journal Entry (รายการสมุดบัญชี)'},
  lineNo:         { type: DataTypes.INTEGER, defaultValue: 0 },
  accountId:      { type: DataTypes.UUID, allowNull: false , comment: 'Account (บัญชี)'},
  description:    { type: DataTypes.STRING(500), allowNull: true , comment: 'Description (คำอธิบาย)'},
  debit:          { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 , comment: 'Debit (เดบิต)'},
  credit:         { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 , comment: 'Credit (เครดิต)'},
  ...auditFields,
}, { tableName: 'JournalLines', timestamps: false })

module.exports = JournalLine

