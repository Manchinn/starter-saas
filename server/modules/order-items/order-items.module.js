const BaseModule = require('../../core/BaseModule')
const router = require('./order-item.routes')

class OrderItemsModule extends BaseModule {
  constructor() {
    super({
      slug: 'order-items',
      name: 'Order Items',
      description: 'Order item management — list, create, edit, and delete order line items',
      icon: 'clipboard-document-list',
      order: 50,
      isCore: false,
      permissions: ['order-items.list', 'order-items.manage'],
      meta: { mountPath: '/api/order-items' },
    })
  }

  register(app) {
    app.use('/api/order-items', router)
  }
}

module.exports = OrderItemsModule
