module.exports = function associate({ Invoice, InvoiceItem, Customer, Order, SaleItem, SalePackage, Product, Store }) {
  Invoice.belongsTo(Customer,   { foreignKey: 'customerId', as: 'customer' })
  Customer.hasMany(Invoice,     { foreignKey: 'customerId', as: 'invoices' })

  Invoice.belongsTo(Order,      { foreignKey: 'orderId',    as: 'order' })
  Order.hasMany(Invoice,        { foreignKey: 'orderId',    as: 'invoices' })

  Invoice.hasMany(InvoiceItem,  { foreignKey: 'invoiceId',  as: 'items', onDelete: 'CASCADE' })
  InvoiceItem.belongsTo(Invoice,{ foreignKey: 'invoiceId',  as: 'invoice' })

  if (SaleItem)    InvoiceItem.belongsTo(SaleItem,    { foreignKey: 'saleItemId',    as: 'saleItem' })
  if (SalePackage) InvoiceItem.belongsTo(SalePackage, { foreignKey: 'salePackageId', as: 'salePackage' })
  if (Product)     InvoiceItem.belongsTo(Product,     { foreignKey: 'productId',     as: 'product' })
  if (Store)       InvoiceItem.belongsTo(Store,       { foreignKey: 'storeId',       as: 'store' })

  // Self-reference for package-header → child rows
  InvoiceItem.belongsTo(InvoiceItem, { foreignKey: 'parentItemId', as: 'parentItem' })
  InvoiceItem.hasMany(InvoiceItem,   { foreignKey: 'parentItemId', as: 'childItems' })
}
