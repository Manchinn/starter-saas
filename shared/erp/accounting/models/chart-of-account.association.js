module.exports = function associate({ ChartOfAccount }) {
  ChartOfAccount.belongsTo(ChartOfAccount, { foreignKey: 'parentId', as: 'parent' })
  ChartOfAccount.hasMany(ChartOfAccount, { foreignKey: 'parentId', as: 'children' })
}
