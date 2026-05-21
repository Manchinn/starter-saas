/**
 * Product associations — Product, ProductCategory, UOM, Store, Vendor.
 */
module.exports = function associate({
  Product, ProductCategory,
  UOM, UOMConversion,
  Store, ProductStore,
  Vendor, ProductVendor,
  SaleItem,
}) {
  // ── ProductCategory self-referential ──────────────────────────────────────
  ProductCategory.belongsTo(ProductCategory, { foreignKey: 'parentId', as: 'parent' })
  ProductCategory.hasMany(ProductCategory,   { foreignKey: 'parentId', as: 'children' })

  // ── Product ↔ UOM ─────────────────────────────────────────────────────────
  Product.belongsTo(UOM, { foreignKey: 'sellingUomId',    as: 'sellingUom' })
  Product.belongsTo(UOM, { foreignKey: 'purchasingUomId', as: 'purchasingUom' })

  // ── UOMConversion ↔ UOM ───────────────────────────────────────────────────
  UOMConversion.belongsTo(UOM, { foreignKey: 'fromUomId', as: 'fromUom' })
  UOMConversion.belongsTo(UOM, { foreignKey: 'toUomId',   as: 'toUom' })

  // ── Product ↔ Store (many-to-many) ────────────────────────────────────────
  Product.belongsToMany(Store, { through: ProductStore, foreignKey: 'productId', as: 'stores' })
  Store.belongsToMany(Product, { through: ProductStore, foreignKey: 'storeId',   as: 'products' })

  // ── Product ↔ Vendor (many-to-many) ──────────────────────────────────────
  Product.belongsToMany(Vendor, { through: ProductVendor, foreignKey: 'productId', as: 'vendors' })
  Vendor.belongsToMany(Product, { through: ProductVendor, foreignKey: 'vendorId',  as: 'products' })

  // ── SaleItem ↔ Product ────────────────────────────────────────────────────
  SaleItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
  Product.hasMany(SaleItem,   { foreignKey: 'productId', as: 'saleItems' })
}
