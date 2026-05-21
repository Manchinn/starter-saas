module.exports = function associate({ MasterDataCategory, MasterDataValue }) {
  MasterDataCategory.hasMany(MasterDataValue, { foreignKey: 'categoryId', as: 'values', onDelete: 'CASCADE' })
  MasterDataValue.belongsTo(MasterDataCategory, { foreignKey: 'categoryId', as: 'category' })
}
