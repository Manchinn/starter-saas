module.exports = function ({ ReceivePayment, ReceivePaymentInvoice, Invoice, Customer }) {
  ReceivePayment.hasMany(ReceivePaymentInvoice, { foreignKey: 'receivePaymentId', as: 'lines', onDelete: 'CASCADE' })
  ReceivePaymentInvoice.belongsTo(ReceivePayment, { foreignKey: 'receivePaymentId', as: 'receivePayment' })
  ReceivePaymentInvoice.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' })
  ReceivePayment.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' })
}
