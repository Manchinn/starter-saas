const defineModule = require('../../core/module')
const router = require('./team.routes')

module.exports = defineModule({
  slug: 'team',
  name: 'Team',
  description: 'Staff account management for a tenant — invite, edit, deactivate and assign roles to your own staff',
  icon: 'user-group',
  order: 11,
  isCore: true,
  permissions: ['team.manage'],
  meta: { mountPath: '/api/team' },
  register(app) {
    app.use('/api/team', router)
  },
})
