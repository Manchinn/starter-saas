const plans = [
  { slug: 'free', name: 'Free', description: 'Core features for getting started.', price: 0, interval: 'month', order: 1, features: { 'erp.invoices': true, 'ai-agent': false }, limits: { seats: 2, 'erp.invoices.monthly': 20 } },
  { slug: 'pro', name: 'Pro', description: 'More capacity and AI Assistant access.', price: 49, interval: 'month', trialDays: 14, order: 2, features: { 'erp.invoices': true, 'ai-agent': true }, limits: { seats: 10, 'erp.invoices.monthly': 500 } },
  { slug: 'enterprise', name: 'Enterprise', description: 'Unlimited usage.', price: 199, interval: 'month', trialDays: 14, order: 3, features: { 'erp.invoices': true, 'ai-agent': true }, limits: { seats: -1, 'erp.invoices.monthly': -1 } },
]

async function seedPlans() {
  const { Plan } = require('../../../models')
  for (const plan of plans) await Plan.findOrCreate({ where: { slug: plan.slug }, defaults: plan })
}

module.exports = { seedPlans, plans }
