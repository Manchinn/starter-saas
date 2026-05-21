module.exports = ({ SalePackage, SalePackageItem, SaleItem }) => {
  SalePackage.hasMany(SalePackageItem, { foreignKey: 'packageId', as: 'packageItems', onDelete: 'CASCADE' })
  SalePackageItem.belongsTo(SalePackage, { foreignKey: 'packageId', as: 'package' })
  SalePackageItem.belongsTo(SaleItem,    { foreignKey: 'saleItemId', as: 'saleItem' })
  SalePackage.belongsToMany(SaleItem, { through: SalePackageItem, foreignKey: 'packageId', otherKey: 'saleItemId', as: 'saleItems' })
}
