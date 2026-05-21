/**
 * Stock Request associations.
 */
module.exports = function associate({
  StockRequest, StockRequestItem, Product, Store,
}) {
  StockRequest.belongsTo(Store, { foreignKey: 'fromStoreId', as: 'fromStore' })
  StockRequest.belongsTo(Store, { foreignKey: 'toStoreId',   as: 'toStore' })

  StockRequest.hasMany(StockRequestItem,   { foreignKey: 'stockRequestId', as: 'items', onDelete: 'CASCADE' })
  StockRequestItem.belongsTo(StockRequest, { foreignKey: 'stockRequestId', as: 'stockRequest' })

  StockRequestItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
  Product.hasMany(StockRequestItem,   { foreignKey: 'productId', as: 'stockRequestItems' })
}
