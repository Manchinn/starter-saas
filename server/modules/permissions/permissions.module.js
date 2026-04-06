const BaseModule = require('../../core/BaseModule')
const router = require('./permission.routes')

class PermissionsModule extends BaseModule {
  constructor() {
    super({
      slug: 'permissions',
      name: 'Permissions',
      description: 'Permission management — define fine-grained access controls',
      icon: 'key',
      order: 40,
      isCore: true,
      permissions: ['permissions.list', 'permissions.manage'],
      meta: { mountPath: '/api/permissions', adminOnly: true },
    })
  }

  register(app) {
    app.use('/api/permissions', router)
  }
}

module.exports = PermissionsModule
