module.exports = function ({ DebitNote, Invoice, Customer }) {
  DebitNote.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' })
  DebitNote.belongsTo(Invoice,  { foreignKey: 'invoiceId',  as: 'invoice' })
}
