module.exports = function ({ VendorPayment, VendorPaymentBill, VendorBill, Vendor }) {
  VendorPayment.hasMany(VendorPaymentBill, { foreignKey: 'vendorPaymentId', as: 'lines', onDelete: 'CASCADE' })
  VendorPaymentBill.belongsTo(VendorPayment, { foreignKey: 'vendorPaymentId', as: 'vendorPayment' })
  VendorPaymentBill.belongsTo(VendorBill, { foreignKey: 'vendorBillId', as: 'bill' })
  VendorPayment.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' })
}
