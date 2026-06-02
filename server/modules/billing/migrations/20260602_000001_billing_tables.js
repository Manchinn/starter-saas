/**
 * Billing tables — Plans, Subscriptions, UsageCounters, SubscriptionInvoices.
 *
 * On a fresh database `sequelize.sync()` has already created these (the models
 * are registered), so each createTable is guarded by tableExists and becomes a
 * no-op that simply records the migration as applied. On a pre-existing database
 * these statements actually create the tables.
 */
module.exports = {
  async up(ctx) {
    const { DataTypes, queryInterface: qi } = ctx
    const timestamps = {
      createdAt: { type: DataTypes.DATE, allowNull: true },
      updatedAt: { type: DataTypes.DATE, allowNull: true },
    }

    if (!(await ctx.tableExists('Plans'))) {
      await qi.createTable('Plans', {
        id:          { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        slug:        { type: DataTypes.STRING, allowNull: false, unique: true },
        name:        { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        price:       { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
        currency:    { type: DataTypes.STRING, allowNull: false, defaultValue: 'USD' },
        interval:    { type: DataTypes.ENUM('month', 'year'), allowNull: false, defaultValue: 'month' },
        trialDays:   { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        features:    { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
        limits:      { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
        isActive:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        isPublic:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        order:       { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        ...timestamps,
      })
    }

    if (!(await ctx.tableExists('Subscriptions'))) {
      await qi.createTable('Subscriptions', {
        id:                     { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        organizationId:         { type: DataTypes.UUID, allowNull: false, unique: true },
        planId:                 { type: DataTypes.UUID, allowNull: false },
        status:                 { type: DataTypes.ENUM('trialing', 'active', 'past_due', 'canceled', 'expired'), allowNull: false, defaultValue: 'active' },
        currentPeriodStart:     { type: DataTypes.DATE, allowNull: true },
        currentPeriodEnd:       { type: DataTypes.DATE, allowNull: true },
        trialEndsAt:            { type: DataTypes.DATE, allowNull: true },
        cancelAtPeriodEnd:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        canceledAt:             { type: DataTypes.DATE, allowNull: true },
        provider:               { type: DataTypes.STRING, allowNull: false, defaultValue: 'manual' },
        providerCustomerId:     { type: DataTypes.STRING, allowNull: true },
        providerSubscriptionId: { type: DataTypes.STRING, allowNull: true },
        ...timestamps,
      })
    }

    if (!(await ctx.tableExists('UsageCounters'))) {
      await qi.createTable('UsageCounters', {
        id:             { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        organizationId: { type: DataTypes.UUID, allowNull: false },
        metric:         { type: DataTypes.STRING, allowNull: false },
        period:         { type: DataTypes.STRING, allowNull: false, defaultValue: 'lifetime' },
        count:          { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        ...timestamps,
      })
    }
    await ctx.addIndex('UsageCounters', ['organizationId', 'metric', 'period'], {
      unique: true, name: 'usage_counters_org_metric_period',
    })

    if (!(await ctx.tableExists('SubscriptionInvoices'))) {
      await qi.createTable('SubscriptionInvoices', {
        id:                { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        organizationId:    { type: DataTypes.UUID, allowNull: false },
        planId:            { type: DataTypes.UUID, allowNull: true },
        number:            { type: DataTypes.STRING, allowNull: true },
        amount:            { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
        currency:          { type: DataTypes.STRING, allowNull: false, defaultValue: 'USD' },
        status:            { type: DataTypes.ENUM('open', 'paid', 'void'), allowNull: false, defaultValue: 'open' },
        periodStart:       { type: DataTypes.DATE, allowNull: true },
        periodEnd:         { type: DataTypes.DATE, allowNull: true },
        paidAt:            { type: DataTypes.DATE, allowNull: true },
        provider:          { type: DataTypes.STRING, allowNull: false, defaultValue: 'manual' },
        providerInvoiceId: { type: DataTypes.STRING, allowNull: true },
        ...timestamps,
      })
    }
  },

  async down(ctx) {
    await ctx.removeIndex('UsageCounters', 'usage_counters_org_metric_period')
    for (const table of ['SubscriptionInvoices', 'UsageCounters', 'Subscriptions', 'Plans']) {
      if (await ctx.tableExists(table)) await ctx.queryInterface.dropTable(table)
    }
  },
}
