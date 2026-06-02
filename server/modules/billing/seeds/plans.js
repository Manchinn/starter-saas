/**
 * Default plan catalog. Idempotent (findOrCreate by slug) so it is safe on every
 * boot. Limits use -1 for "unlimited"; feature keys gate functionality via
 * requireFeature(). Tune freely — this is starter reference data.
 */
module.exports = {
  name: 'billing-plans',
  tier: 'core',
  order: 40, // before role/permission demo data; plans have no dependencies
  async run(ctx) {
    const { Plan } = ctx.models

    const PLANS = [
      {
        slug: 'free', name: 'Free', description: 'Get started — core features with modest limits.',
        price: 0, interval: 'month', trialDays: 0, isPublic: true, order: 1,
        features: { 'erp.invoices': true, 'erp.purchasing': false, 'ai-agent': false },
        limits: { seats: 2, 'erp.invoices.monthly': 20, storageMb: 256 },
      },
      {
        slug: 'pro', name: 'Pro', description: 'For growing teams — higher limits and the AI assistant.',
        price: 49, interval: 'month', trialDays: 14, isPublic: true, order: 2,
        features: { 'erp.invoices': true, 'erp.purchasing': true, 'ai-agent': true },
        limits: { seats: 10, 'erp.invoices.monthly': 500, storageMb: 10240 },
      },
      {
        slug: 'enterprise', name: 'Enterprise', description: 'Unlimited usage with every feature.',
        price: 199, interval: 'month', trialDays: 14, isPublic: true, order: 3,
        features: { 'erp.invoices': true, 'erp.purchasing': true, 'ai-agent': true },
        limits: { seats: -1, 'erp.invoices.monthly': -1, storageMb: -1 },
      },
    ]

    let created = 0
    for (const p of PLANS) {
      const [, made] = await Plan.findOrCreate({ where: { slug: p.slug }, defaults: p })
      if (made) created++
    }
    ctx.log?.info?.(`Billing plans: ${created} created, ${PLANS.length - created} already present`)
  },
}
