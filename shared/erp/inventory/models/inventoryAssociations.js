/**
 * Inventory associations — StoreStock ↔ Product/Store.
 */
module.exports = function associate({ StoreStock, Product, Store }) {
  StoreStock.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
  StoreStock.belongsTo(Store,   { foreignKey: 'storeId',   as: 'store' })
  Product.hasMany(StoreStock,   { foreignKey: 'productId', as: 'storeStocks' })
  Store.hasMany(StoreStock,     { foreignKey: 'storeId',   as: 'storeStocks' })
}
