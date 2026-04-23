/**
 * Stock Adjust associations.
 */
module.exports = function associate({
  StockAdjust, StockAdjustItem, Product, Store,
}) {
  StockAdjust.hasMany(StockAdjustItem,   { foreignKey: 'stockAdjustId', as: 'items', onDelete: 'CASCADE' })
  StockAdjustItem.belongsTo(StockAdjust, { foreignKey: 'stockAdjustId', as: 'stockAdjust' })

  StockAdjust.belongsTo(Store, { foreignKey: 'storeId', as: 'store' })

  StockAdjustItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
  Product.hasMany(StockAdjustItem,   { foreignKey: 'productId', as: 'stockAdjustItems' })
}
