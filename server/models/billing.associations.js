/**
 * Billing associations — Plan / Subscription / SubscriptionInvoice / UsageCounter
 * and their links back to the core User (an organization is a top-level User).
 * Invoked from server/models/index.js once the full registry is built.
 */
module.exports = function associate({
  User, Plan, Subscription, SubscriptionInvoice, UsageCounter,
}) {
  // ── Plan ↔ Subscription ───────────────────────────────────────────────────
  Plan.hasMany(Subscription,        { foreignKey: 'planId', as: 'subscriptions' })
  Subscription.belongsTo(Plan,      { foreignKey: 'planId', as: 'plan' })

  // ── Plan ↔ SubscriptionInvoice ────────────────────────────────────────────
  Plan.hasMany(SubscriptionInvoice,    { foreignKey: 'planId', as: 'invoices' })
  SubscriptionInvoice.belongsTo(Plan,  { foreignKey: 'planId', as: 'plan' })

  // ── Organization (User) ↔ billing rows ──────────────────────────────────────
  User.hasOne(Subscription,          { foreignKey: 'organizationId', as: 'subscription', onDelete: 'CASCADE' })
  Subscription.belongsTo(User,       { foreignKey: 'organizationId', as: 'organization' })

  User.hasMany(SubscriptionInvoice,         { foreignKey: 'organizationId', as: 'subscriptionInvoices', onDelete: 'CASCADE' })
  SubscriptionInvoice.belongsTo(User,       { foreignKey: 'organizationId', as: 'organization' })

  User.hasMany(UsageCounter,        { foreignKey: 'organizationId', as: 'usageCounters', onDelete: 'CASCADE' })
  UsageCounter.belongsTo(User,      { foreignKey: 'organizationId', as: 'organization' })
}
