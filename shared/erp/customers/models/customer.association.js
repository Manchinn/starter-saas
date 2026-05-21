/**
 * Customer associations — Customer, CustomerGroup.
 */
module.exports = function associate({ Customer, CustomerGroup }) {
  CustomerGroup.hasMany(Customer, { foreignKey: 'customerGroupId', as: 'customers' })
  Customer.belongsTo(CustomerGroup, { foreignKey: 'customerGroupId', as: 'group' })
}
