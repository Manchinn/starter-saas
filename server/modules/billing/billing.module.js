const defineModule = require('../../core/module')
const router = require('./billing.routes')

module.exports = defineModule({
  slug: 'billing',
  name: 'Billing',
  description: 'Subscriptions, plans, usage metering and billing history',
  icon: 'credit-card',
  order: 15,
  isCore: true,
  permissions: ['billing.manage'],
  meta: { mountPath: '/api/billing', adminOnly: true },
  register(app) {
    app.use('/api/billing', router)
  },
})
