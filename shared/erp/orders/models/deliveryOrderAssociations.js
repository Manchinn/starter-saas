module.exports = function ({ DeliveryOrder, DeliveryOrderItem, Customer, Order, Product }) {
  DeliveryOrder.hasMany(DeliveryOrderItem, { foreignKey: 'deliveryOrderId', as: 'items', onDelete: 'CASCADE' })
  DeliveryOrderItem.belongsTo(DeliveryOrder, { foreignKey: 'deliveryOrderId', as: 'deliveryOrder' })

  DeliveryOrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' })

  DeliveryOrder.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' })
  DeliveryOrder.belongsTo(Order,    { foreignKey: 'orderId',    as: 'salesOrder' })
}
