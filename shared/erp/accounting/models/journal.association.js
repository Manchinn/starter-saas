module.exports = ({ Journal, JournalLine, ChartOfAccount }) => {
  Journal.hasMany(JournalLine, { foreignKey: 'journalId', as: 'lines', onDelete: 'CASCADE' })
  JournalLine.belongsTo(Journal, { foreignKey: 'journalId', as: 'journal' })
  JournalLine.belongsTo(ChartOfAccount, { foreignKey: 'accountId', as: 'account' })
}
