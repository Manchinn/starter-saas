/**
 * Stock Count associations.
 */
module.exports = function associate({ StockCount, StockCountItem, Product, Store }) {
  StockCount.belongsTo(Store, { foreignKey: 'storeId', as: 'store' })

  StockCount.hasMany(StockCountItem,   { foreignKey: 'stockCountId', as: 'items', onDelete: 'CASCADE' })
  StockCountItem.belongsTo(StockCount, { foreignKey: 'stockCountId', as: 'stockCount' })

  StockCountItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
}
