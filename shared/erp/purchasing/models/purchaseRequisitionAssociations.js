module.exports = function ({ PurchaseRequisition, PurchaseRequisitionItem, Product, Vendor }) {
  PurchaseRequisition.hasMany(PurchaseRequisitionItem, { foreignKey: 'requisitionId', as: 'items', onDelete: 'CASCADE' })
  PurchaseRequisitionItem.belongsTo(PurchaseRequisition, { foreignKey: 'requisitionId', as: 'requisition' })

  PurchaseRequisitionItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' })

  PurchaseRequisition.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' })
}
