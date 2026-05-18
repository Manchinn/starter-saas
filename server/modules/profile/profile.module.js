const defineModule = require('../../core/module')
const router = require('./profile.routes')

module.exports = defineModule({
  slug: 'profile',
  name: 'Profile',
  description: 'Self-service profile and active sessions',
  icon: 'user-circle',
  order: 1,
  isCore: true,
  meta: { mountPath: '/api/profile' },
  register(app) {
    app.use('/api/profile', router)
  },
})
