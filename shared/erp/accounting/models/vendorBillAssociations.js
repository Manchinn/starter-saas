module.exports = ({ VendorBill, VendorBillItem, Vendor, PurchaseOrder, GoodReceive }) => {
  VendorBill.hasMany(VendorBillItem,    { foreignKey: 'billId', as: 'items', onDelete: 'CASCADE' })
  VendorBillItem.belongsTo(VendorBill,  { foreignKey: 'billId', as: 'bill' })

  if (Vendor)        VendorBill.belongsTo(Vendor,        { foreignKey: 'vendorId',        as: 'vendor' })
  if (PurchaseOrder) VendorBill.belongsTo(PurchaseOrder, { foreignKey: 'purchaseOrderId', as: 'purchaseOrder' })
  if (GoodReceive)   VendorBill.belongsTo(GoodReceive,   { foreignKey: 'goodReceiveId',   as: 'goodReceive' })
}
