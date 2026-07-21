module.exports = function associate({ LineConnection, LineUserMapping, Customer }) {
  LineConnection.hasMany(LineUserMapping, { foreignKey: 'lineConnectionId', as: 'userMappings' })
  LineUserMapping.belongsTo(LineConnection, { foreignKey: 'lineConnectionId', as: 'connection' })
  Customer.hasMany(LineUserMapping, { foreignKey: 'customerId', as: 'lineMappings' })
  LineUserMapping.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' })
}
