const BaseModule = require('../../server/core/BaseModule')
const router = require('./item.routes')

class ItemsModule extends BaseModule {
  constructor() {
    super({
      slug: 'items',
      name: 'items',
      description: 'Example CRUD module — manage items',
      icon: 'clipboard-document-list',
      order: 20,
      isCore: false,
      permissions: ['items.list', 'items.edit', 'items.delete'],
      meta: { mountPath: '/api/items' },
    })
  }

  register(app) {
    app.use('/api/items', router)
  }
}

module.exports = ItemsModule
