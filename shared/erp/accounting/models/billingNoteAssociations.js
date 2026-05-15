module.exports = function ({ BillingNote, BillingNoteInvoice, Invoice, Customer }) {
  BillingNote.hasMany(BillingNoteInvoice, { foreignKey: 'billingNoteId', as: 'lines', onDelete: 'CASCADE' })
  BillingNoteInvoice.belongsTo(BillingNote, { foreignKey: 'billingNoteId', as: 'billingNote' })

  BillingNoteInvoice.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' })

  BillingNote.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' })
}
