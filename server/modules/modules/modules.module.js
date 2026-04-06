const BaseModule = require('../../core/BaseModule')
const router = require('./module.routes')

class ModulesModule extends BaseModule {
  constructor() {
    super({
      slug: 'modules',
      name: 'Modules',
      description: 'Module management — enable, disable, configure application modules',
      icon: 'puzzle-piece',
      order: 20,
      isCore: true,
      permissions: ['modules.list', 'modules.manage'],
      meta: { mountPath: '/api/modules', adminOnly: true },
    })
  }

  register(app) {
    app.use('/api/modules', router)
  }
}

module.exports = ModulesModule
