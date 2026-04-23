/**
 * Stock Return associations.
 */
module.exports = function associate({
  StockReturn, StockReturnItem, Product, Store, Customer, Vendor,
}) {
  StockReturn.belongsTo(Store,    { foreignKey: 'storeId',    as: 'store' })
  StockReturn.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' })
  StockReturn.belongsTo(Vendor,   { foreignKey: 'vendorId',   as: 'vendor' })

  StockReturn.hasMany(StockReturnItem,   { foreignKey: 'stockReturnId', as: 'items', onDelete: 'CASCADE' })
  StockReturnItem.belongsTo(StockReturn, { foreignKey: 'stockReturnId', as: 'stockReturn' })

  StockReturnItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
}
