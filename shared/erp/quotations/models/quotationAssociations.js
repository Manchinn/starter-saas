module.exports = function associate({ Quotation, QuotationItem, Customer, SaleItem, Product }) {
  Quotation.belongsTo(Customer,      { foreignKey: 'customerId',  as: 'customer' })
  Customer.hasMany(Quotation,        { foreignKey: 'customerId',  as: 'quotations' })

  Quotation.hasMany(QuotationItem,   { foreignKey: 'quotationId', as: 'items', onDelete: 'CASCADE' })
  QuotationItem.belongsTo(Quotation, { foreignKey: 'quotationId', as: 'quotation' })

  QuotationItem.belongsTo(SaleItem,  { foreignKey: 'saleItemId',  as: 'saleItem' })
  QuotationItem.belongsTo(Product,   { foreignKey: 'productId',   as: 'product' })
}
