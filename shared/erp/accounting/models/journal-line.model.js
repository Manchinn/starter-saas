const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const JournalLine = sequelize.define('JournalLine', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  journalId:      { type: DataTypes.UUID, allowNull: false },
  lineNo:         { type: DataTypes.INTEGER, defaultValue: 0 },
  accountId:      { type: DataTypes.UUID, allowNull: false },
  description:    { type: DataTypes.STRING(500), allowNull: true },
  debit:          { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  credit:         { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  ...auditFields,
}, { tableName: 'JournalLines', timestamps: false })

module.exports = JournalLine

