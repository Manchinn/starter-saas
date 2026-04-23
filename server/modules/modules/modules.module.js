const defineModule = require('../../core/module')
const router = require('./module.routes')

module.exports = defineModule({
  slug: 'modules',
  name: 'Modules',
  description: 'Module management — enable, disable, configure application modules',
  icon: 'puzzle-piece',
  order: 20,
  isCore: true,
  permissions: ['modules.list', 'modules.manage'],
  meta: { mountPath: '/api/modules', adminOnly: true },
  register(app) {
    app.use('/api/modules', router)
  },
})
