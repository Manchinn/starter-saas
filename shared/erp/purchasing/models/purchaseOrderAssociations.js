module.exports = function ({ PurchaseOrder, PurchaseOrderItem, Product, Vendor, PurchaseRequisition }) {
  PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'purchaseOrderId', as: 'items', onDelete: 'CASCADE' })
  PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'purchaseOrderId', as: 'purchaseOrder' })

  PurchaseOrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' })

  PurchaseOrder.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' })

  if (PurchaseRequisition) {
    PurchaseOrder.belongsTo(PurchaseRequisition, { foreignKey: 'requisitionId', as: 'requisition' })
  }
}
