module.exports = function associate({ User, Plan, Subscription, SubscriptionInvoice, UsageCounter }) {
  Plan.hasMany(Subscription, { foreignKey: 'planId', as: 'subscriptions' })
  Subscription.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' })
  Plan.hasMany(SubscriptionInvoice, { foreignKey: 'planId', as: 'subscriptionInvoices' })
  SubscriptionInvoice.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' })

  User.hasOne(Subscription, { foreignKey: 'organizationId', as: 'subscription', onDelete: 'CASCADE' })
  Subscription.belongsTo(User, { foreignKey: 'organizationId', as: 'organization' })
  User.hasMany(SubscriptionInvoice, { foreignKey: 'organizationId', as: 'subscriptionInvoices', onDelete: 'CASCADE' })
  SubscriptionInvoice.belongsTo(User, { foreignKey: 'organizationId', as: 'organization' })
  User.hasMany(UsageCounter, { foreignKey: 'organizationId', as: 'usageCounters', onDelete: 'CASCADE' })
  UsageCounter.belongsTo(User, { foreignKey: 'organizationId', as: 'organization' })
}
