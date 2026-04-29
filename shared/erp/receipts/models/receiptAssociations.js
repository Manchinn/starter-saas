module.exports = function associate({ Receipt, Customer, Invoice }) {
  Receipt.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' })
  Customer.hasMany(Receipt,   { foreignKey: 'customerId', as: 'receipts' })

  Receipt.belongsTo(Invoice,  { foreignKey: 'invoiceId',  as: 'invoice' })
  Invoice.hasMany(Receipt,    { foreignKey: 'invoiceId',  as: 'receipts' })
}
