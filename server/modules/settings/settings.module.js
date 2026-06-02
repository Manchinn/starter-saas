const defineModule = require('../../core/module')
const router = require('./settings.routes')

module.exports = defineModule({
  slug: 'settings',
  name: 'Settings',
  description: 'Platform settings — email (SMTP) and other admin-managed configuration.',
  icon: 'cog-6-tooth',
  order: 1,
  isCore: true,
  permissions: [],
  meta: { mountPath: '/api/settings' },
  register(app) {
    app.use('/api/settings', router)
  },
})
