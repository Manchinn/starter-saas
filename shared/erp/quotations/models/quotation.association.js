module.exports = function associate({ Quotation, QuotationItem, Customer, SaleItem, SalePackage, Product, Store }) {
  Quotation.belongsTo(Customer,      { foreignKey: 'customerId',  as: 'customer' })
  Customer.hasMany(Quotation,        { foreignKey: 'customerId',  as: 'quotations' })

  Quotation.hasMany(QuotationItem,   { foreignKey: 'quotationId', as: 'items', onDelete: 'CASCADE' })
  QuotationItem.belongsTo(Quotation, { foreignKey: 'quotationId', as: 'quotation' })

  QuotationItem.belongsTo(SaleItem,  { foreignKey: 'saleItemId',  as: 'saleItem' })
  QuotationItem.belongsTo(Product,   { foreignKey: 'productId',   as: 'product' })

  if (SalePackage) {
    QuotationItem.belongsTo(SalePackage, { foreignKey: 'salePackageId', as: 'salePackage' })
    SalePackage.hasMany(QuotationItem,   { foreignKey: 'salePackageId', as: 'quotationItems' })
  }
  if (Store) {
    QuotationItem.belongsTo(Store, { foreignKey: 'storeId', as: 'store' })
    Store.hasMany(QuotationItem,   { foreignKey: 'storeId', as: 'quotationItems' })
  }

  // Self-reference for package-header → child rows
  QuotationItem.belongsTo(QuotationItem, { foreignKey: 'parentItemId', as: 'parentItem' })
  QuotationItem.hasMany(QuotationItem,   { foreignKey: 'parentItemId', as: 'childItems' })
}
