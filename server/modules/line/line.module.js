const defineModule = require('../../core/module')
const router = require('./routes/line.routes')
const { setImplementation } = require('../../../shared/erp/notifications/customer-notify')
const { notifyCustomer: lineNotifyCustomer } = require('../../../shared/erp/line-integration/services/line-notification.service')

module.exports = defineModule({
  slug: 'line-integration',
  name: 'LINE Integration',
  description: 'LIFF ordering and LINE Messaging API connection per organization',
  icon: 'chat-bubble-left-right',
  order: 92,
  isCore: false,
  permissions: ['erp.line-integration.manage'],
  meta: { mountPath: '/api/line' },
  register(app) {
    app.use('/api/line', router)
    // Install LINE as the Customer notify delivery channel for this process.
    setImplementation(lineNotifyCustomer)
    // Module permissions must be available on existing installations too;
    // never block route registration when SQLite is temporarily locked.
    const { Permission } = require('../../models')
    Permission.findOrCreate({
      where: { slug: 'erp.line-integration.manage' },
      defaults: { name: 'Manage LINE Integration', group: 'erp', description: 'Configure LINE LIFF and Messaging API' },
    }).catch(() => {})
  },
})
