const defineModule = require('../../core/module')
const router = require('./dashboard.routes')

module.exports = defineModule({
  slug: 'dashboard',
  name: 'Dashboard',
  description: 'Overview statistics and activity',
  icon: 'chart-bar',
  order: 1,
  isCore: true,
  permissions: ['dashboard.view'],
  meta: { mountPath: '/api/dashboard', route: '/dashboard' },
  register(app) {
    app.use('/api/dashboard', router)
  },
})
