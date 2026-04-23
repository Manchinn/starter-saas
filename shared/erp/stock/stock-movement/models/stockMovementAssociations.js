/**
 * Stock Movement associations.
 */
module.exports = function associate({ StockMovement, Product, Store }) {
  StockMovement.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
  Product.hasMany(StockMovement,   { foreignKey: 'productId', as: 'stockMovements' })

  StockMovement.belongsTo(Store, { foreignKey: 'storeId', as: 'store' })
}
