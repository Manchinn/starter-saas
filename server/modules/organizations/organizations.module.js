const defineModule = require('../../core/module')
const router = require('./organization.routes')

module.exports = defineModule({
  slug: 'organizations',
  name: 'Organizations',
  description: 'Organization management — list, edit, assign modules',
  icon: 'building-office-2',
  order: 10,
  isCore: true,
  permissions: ['organizations.list', 'organizations.edit', 'organizations.delete'],
  meta: { mountPath: '/api/organizations', adminOnly: true },
  register(app) {
    app.use('/api/organizations', router)
  },
})
