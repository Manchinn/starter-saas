const defineModule = require('../../core/module')
const router = require('./auth.routes')

module.exports = defineModule({
  slug: 'auth',
  name: 'Authentication',
  description: 'User registration, login, token management',
  icon: 'lock-closed',
  order: 0,
  isCore: true,
  permissions: ['auth.login', 'auth.register'],
  meta: { mountPath: '/api/auth' },
  register(app) {
    app.use('/api/auth', router)
  },
})
