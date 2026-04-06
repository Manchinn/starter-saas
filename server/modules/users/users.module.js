const BaseModule = require('../../core/BaseModule')
const router = require('./user.routes')

class UsersModule extends BaseModule {
  constructor() {
    super({
      slug: 'users',
      name: 'Users',
      description: 'User management — list, edit, assign modules',
      icon: 'users',
      order: 10,
      isCore: true,
      permissions: ['users.list', 'users.edit', 'users.delete'],
      meta: { mountPath: '/api/users', adminOnly: true },
    })
  }

  register(app) {
    app.use('/api/users', router)
  }
}

module.exports = UsersModule
