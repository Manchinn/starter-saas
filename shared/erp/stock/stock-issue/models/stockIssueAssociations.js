/**
 * Stock Issue associations.
 */
module.exports = function associate({ StockIssue, StockIssueItem, Product, Store }) {
  StockIssue.belongsTo(Store, { foreignKey: 'storeId', as: 'store' })

  StockIssue.hasMany(StockIssueItem,   { foreignKey: 'stockIssueId', as: 'items', onDelete: 'CASCADE' })
  StockIssueItem.belongsTo(StockIssue, { foreignKey: 'stockIssueId', as: 'stockIssue' })

  StockIssueItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
  Product.hasMany(StockIssueItem,   { foreignKey: 'productId', as: 'stockIssueItems' })
}
