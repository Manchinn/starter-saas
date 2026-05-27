const defineModule = require('../../core/module')
const router = require('./system.routes')

module.exports = defineModule({
  slug: 'system',
  name: 'System',
  description: 'System bootstrap & infrastructure endpoints (DB selection, health, etc.)',
  icon: 'cog-6-tooth',
  order: 0,
  isCore: true,
  permissions: [],
  meta: { mountPath: '/api/system' },
  register(app) {
    app.use('/api/system', router)
  },
})
