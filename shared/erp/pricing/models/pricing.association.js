/**
 * Pricing associations — Pricing linked to CustomerGroup and SaleItem.
 */
module.exports = function associate({ Pricing, CustomerGroup, SaleItem }) {
  CustomerGroup.hasMany(Pricing, { foreignKey: 'customerGroupId', as: 'pricings' })
  Pricing.belongsTo(CustomerGroup, { foreignKey: 'customerGroupId', as: 'customerGroup' })

  Pricing.belongsTo(SaleItem, { foreignKey: 'saleItemId', as: 'saleItem' })
  SaleItem.hasMany(Pricing,   { foreignKey: 'saleItemId', as: 'pricings' })
}
