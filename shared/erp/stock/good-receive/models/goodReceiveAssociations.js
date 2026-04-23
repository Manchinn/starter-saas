/**
 * Good Receive associations.
 */
module.exports = function associate({
  GoodReceive, GoodReceiveItem, Product, Store, UOM,
}) {
  GoodReceive.hasMany(GoodReceiveItem,   { foreignKey: 'goodReceiveId', as: 'items', onDelete: 'CASCADE' })
  GoodReceiveItem.belongsTo(GoodReceive, { foreignKey: 'goodReceiveId', as: 'goodReceive' })

  GoodReceive.belongsTo(Store, { foreignKey: 'storeId', as: 'store' })

  GoodReceiveItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
  Product.hasMany(GoodReceiveItem,   { foreignKey: 'productId', as: 'goodReceiveItems' })

  GoodReceiveItem.belongsTo(UOM, { foreignKey: 'qtyUomId',     as: 'qtyUom' })
  GoodReceiveItem.belongsTo(UOM, { foreignKey: 'freeQtyUomId', as: 'freeQtyUom' })
}
