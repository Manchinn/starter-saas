const defineModule = require('../../core/module')
const router = require('./permission.routes')

module.exports = defineModule({
  slug: 'permissions',
  name: 'Permissions',
  description: 'Permission management — define fine-grained access controls',
  icon: 'key',
  order: 40,
  isCore: true,
  permissions: ['permissions.list', 'permissions.manage'],
  meta: { mountPath: '/api/permissions', adminOnly: true },
  register(app) {
    app.use('/api/permissions', router)
  },
})
