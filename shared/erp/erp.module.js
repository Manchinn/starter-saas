const BaseModule = require('../../server/core/BaseModule')
const customerRouter = require('./customer.routes')
const productRouter = require('./product.routes')
const orderRouter = require('./order.routes')
const pricingRouter = require('./pricing.routes')
const productCategoryRouter = require('./product-category.routes')
const storeRouter = require('./store.routes')
const uomRouter = require('./uom.routes')
const goodReceiveRouter = require('./good-receive.routes')
const stockAdjustRouter = require('./stock-adjust.routes')
const stockMovementRouter = require('./stock-movement.routes')
const stockRequestRouter = require('./stock-request.routes')
const stockCountRouter = require('./stock-count.routes')
const dashboardRouter = require('./dashboard.routes')
const uomConversionRouter = require('./uom-conversion.routes')
const vendorRouter = require('./vendor.routes')
const stockReturnRouter = require('./stock-return.routes')
const stockBalanceRouter = require('./stock-balance.routes')

class ERPModule extends BaseModule {
  constructor() {
    super({
      slug: 'erp',
      name: 'ERP',
      description: 'Lightweight ERP — customers, item master, and orders',
      icon: 'building-office-2',
      order: 30,
      isCore: false,
      permissions: [
        'erp.customers.list', 'erp.customers.edit', 'erp.customers.delete',
        'erp.products.list', 'erp.products.edit', 'erp.products.delete',
        'erp.orders.list', 'erp.orders.edit', 'erp.orders.delete',
        'erp.pricing.list', 'erp.pricing.manage',
        'erp.stores.list', 'erp.stores.edit', 'erp.stores.delete',
        'erp.uom.list', 'erp.uom.edit', 'erp.uom.delete',
        'erp.stock.list', 'erp.stock.edit', 'erp.stock.delete',
      ],
      meta: { mountPath: '/api/erp' },
    })
  }

  register(app) {
    app.use('/api/erp/dashboard', dashboardRouter)
    app.use('/api/erp/customers', customerRouter)
    app.use('/api/erp/item-master', productRouter)
    app.use('/api/erp/orders', orderRouter)
    app.use('/api/erp/pricing', pricingRouter)
    app.use('/api/erp/product-categories', productCategoryRouter)
    app.use('/api/erp/stores', storeRouter)
    app.use('/api/erp/uom', uomRouter)
    app.use('/api/erp/good-receive', goodReceiveRouter)
    app.use('/api/erp/stock-adjust', stockAdjustRouter)
    app.use('/api/erp/stock-movements', stockMovementRouter)
    app.use('/api/erp/stock-request', stockRequestRouter)
    app.use('/api/erp/stock-count', stockCountRouter)
    app.use('/api/erp/uom-conversion', uomConversionRouter)
    app.use('/api/erp/vendors', vendorRouter)
    app.use('/api/erp/stock-return', stockReturnRouter)
    app.use('/api/erp/stock-balance', stockBalanceRouter)
  }
}

module.exports = ERPModule
