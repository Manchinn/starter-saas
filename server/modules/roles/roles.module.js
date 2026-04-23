const defineModule = require('../../core/module')
const router = require('./role.routes')

module.exports = defineModule({
  slug: 'roles',
  name: 'Roles',
  description: 'Role management — create roles and assign permissions',
  icon: 'shield-check',
  order: 30,
  isCore: true,
  permissions: ['roles.list', 'roles.manage'],
  meta: { mountPath: '/api/roles', adminOnly: true },
  register(app) {
    app.use('/api/roles', router)
  },
})
