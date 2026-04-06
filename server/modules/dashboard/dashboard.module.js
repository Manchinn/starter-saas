const BaseModule = require('../../core/BaseModule')
const router = require('./dashboard.routes')

class DashboardModule extends BaseModule {
  constructor() {
    super({
      slug: 'dashboard',
      name: 'Dashboard',
      description: 'Overview statistics and activity',
      icon: 'chart-bar',
      order: 1,
      isCore: true,
      permissions: ['dashboard.view'],
      meta: { mountPath: '/api/dashboard', route: '/dashboard' },
    })
  }

  register(app) {
    app.use('/api/dashboard', router)
  }
}

module.exports = DashboardModule
