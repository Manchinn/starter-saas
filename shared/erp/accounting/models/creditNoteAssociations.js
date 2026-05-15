module.exports = function ({ CreditNote, Invoice, Customer }) {
  CreditNote.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' })
  CreditNote.belongsTo(Invoice,  { foreignKey: 'invoiceId',  as: 'invoice' })
}
