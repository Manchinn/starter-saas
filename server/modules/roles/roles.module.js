const BaseModule = require('../../core/BaseModule')
const router = require('./role.routes')

class RolesModule extends BaseModule {
  constructor() {
    super({
      slug: 'roles',
      name: 'Roles',
      description: 'Role management — create roles and assign permissions',
      icon: 'shield-check',
      order: 30,
      isCore: true,
      permissions: ['roles.list', 'roles.manage'],
      meta: { mountPath: '/api/roles', adminOnly: true },
    })
  }

  register(app) {
    app.use('/api/roles', router)
  }
}

module.exports = RolesModule
