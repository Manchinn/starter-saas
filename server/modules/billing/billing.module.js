const defineModule = require('../../core/module')
const router = require('./billing.routes')

module.exports = defineModule({
  slug: 'billing', name: 'Billing', description: 'Subscription plans, usage quotas, and billing history', icon: 'credit-card', order: 92, isCore: true,
  permissions: ['billing.manage'], meta: { mountPath: '/api/billing', adminOnly: true },
  register(app) {
    app.use('/api/billing', router)
    const { Permission } = require('../../models')
    Permission.findOrCreate({ where: { slug: 'billing.manage' }, defaults: { name: 'Manage Billing', group: 'billing', description: 'Manage plans and organization subscriptions' } }).catch(() => {})
  },
})
