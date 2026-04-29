module.exports = function associate({ Invoice, InvoiceItem, Customer, Order }) {
  Invoice.belongsTo(Customer,   { foreignKey: 'customerId', as: 'customer' })
  Customer.hasMany(Invoice,     { foreignKey: 'customerId', as: 'invoices' })

  Invoice.belongsTo(Order,      { foreignKey: 'orderId',    as: 'order' })
  Order.hasMany(Invoice,        { foreignKey: 'orderId',    as: 'invoices' })

  Invoice.hasMany(InvoiceItem,  { foreignKey: 'invoiceId',  as: 'items', onDelete: 'CASCADE' })
  InvoiceItem.belongsTo(Invoice,{ foreignKey: 'invoiceId',  as: 'invoice' })
}
