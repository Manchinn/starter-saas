module.exports = {
  async up(ctx) {
    const { DataTypes, queryInterface: qi } = ctx
    const timestamps = { createdAt: { type: DataTypes.DATE }, updatedAt: { type: DataTypes.DATE } }
    if (!(await ctx.tableExists('Plans'))) await qi.createTable('Plans', {
      id: { type: DataTypes.UUID, primaryKey: true }, slug: { type: DataTypes.STRING, allowNull: false, unique: true },
      name: { type: DataTypes.STRING, allowNull: false }, description: { type: DataTypes.TEXT },
      price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 }, currency: { type: DataTypes.STRING, allowNull: false, defaultValue: 'USD' },
      interval: { type: DataTypes.ENUM('month', 'year'), allowNull: false, defaultValue: 'month' }, trialDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      features: { type: DataTypes.JSON, allowNull: false, defaultValue: {} }, limits: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }, isPublic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }, order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, ...timestamps,
    })
    if (!(await ctx.tableExists('Subscriptions'))) await qi.createTable('Subscriptions', {
      id: { type: DataTypes.UUID, primaryKey: true }, organizationId: { type: DataTypes.UUID, allowNull: false, unique: true }, planId: { type: DataTypes.UUID, allowNull: false },
      status: { type: DataTypes.ENUM('trialing', 'active', 'past_due', 'canceled', 'expired'), allowNull: false, defaultValue: 'active' }, currentPeriodStart: { type: DataTypes.DATE }, currentPeriodEnd: { type: DataTypes.DATE }, trialEndsAt: { type: DataTypes.DATE },
      cancelAtPeriodEnd: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }, canceledAt: { type: DataTypes.DATE }, provider: { type: DataTypes.STRING, allowNull: false, defaultValue: 'manual' }, providerCustomerId: { type: DataTypes.STRING }, providerSubscriptionId: { type: DataTypes.STRING }, ...timestamps,
    })
    if (!(await ctx.tableExists('UsageCounters'))) await qi.createTable('UsageCounters', {
      id: { type: DataTypes.UUID, primaryKey: true }, organizationId: { type: DataTypes.UUID, allowNull: false }, metric: { type: DataTypes.STRING, allowNull: false }, period: { type: DataTypes.STRING, allowNull: false, defaultValue: 'lifetime' }, count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, ...timestamps,
    })
    await ctx.addIndex('UsageCounters', ['organizationId', 'metric', 'period'], { unique: true, name: 'usage_counters_org_metric_period' })
    if (!(await ctx.tableExists('SubscriptionInvoices'))) await qi.createTable('SubscriptionInvoices', {
      id: { type: DataTypes.UUID, primaryKey: true }, organizationId: { type: DataTypes.UUID, allowNull: false }, planId: { type: DataTypes.UUID }, number: { type: DataTypes.STRING }, amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 }, currency: { type: DataTypes.STRING, allowNull: false, defaultValue: 'USD' }, status: { type: DataTypes.ENUM('open', 'paid', 'void'), allowNull: false, defaultValue: 'open' }, periodStart: { type: DataTypes.DATE }, periodEnd: { type: DataTypes.DATE }, paidAt: { type: DataTypes.DATE }, provider: { type: DataTypes.STRING, allowNull: false, defaultValue: 'manual' }, providerInvoiceId: { type: DataTypes.STRING }, ...timestamps,
    })
  },
  async down(ctx) {
    await ctx.removeIndex('UsageCounters', 'usage_counters_org_metric_period')
    for (const table of ['SubscriptionInvoices', 'UsageCounters', 'Subscriptions', 'Plans']) {
      if (await ctx.tableExists(table)) await ctx.queryInterface.dropTable(table)
    }
  },
}
