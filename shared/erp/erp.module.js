const defineModule = require('../../server/core/module')
const customerRouter        = require('./customers/customer.routes')
const customerGroupRouter   = require('./customers/customer-group.routes')
const productRouter         = require('./products/product.routes')
const orderRouter           = require('./orders/order.routes')
const pricingRouter         = require('./pricing/pricing.routes')
const productCategoryRouter = require('./products/product-category.routes')
const storeRouter           = require('./inventory/store.routes')
const uomRouter             = require('./inventory/uom.routes')
const goodReceiveRouter     = require('./stock/good-receive/good-receive.routes')
const stockAdjustRouter     = require('./stock/stock-adjust/stock-adjust.routes')
const stockMovementRouter   = require('./stock/stock-movement/stock-movement.routes')
const stockRequestRouter    = require('./stock/stock-request/stock-request.routes')
const stockCountRouter      = require('./stock/stock-count/stock-count.routes')
const dashboardRouter       = require('./dashboard/dashboard.routes')
const uomConversionRouter   = require('./inventory/uom-conversion.routes')
const vendorRouter          = require('./vendors/vendor.routes')
const stockReturnRouter     = require('./stock/stock-return/stock-return.routes')
const stockBalanceRouter    = require('./stock/stock-balance/stock-balance.routes')
const sequenceRouter        = require('./settings/sequence.routes')
const generalSettingsRouter = require('./settings/general.routes')
const demoDataRouter        = require('./settings/demo-data.routes')
const stockIssueRouter      = require('./stock/stock-issue/stock-issue.routes')
const saleItemRouter        = require('./sale/sale-item.routes')
const employeeRouter        = require('./hrms/employee.routes')
const departmentRouter      = require('./hrms/department.routes')

module.exports = defineModule({
  slug: 'erp',
  name: 'ERP',
  description: 'Lightweight ERP — customers, item master, and orders',
  icon: 'building-office-2',
  order: 30,
  isCore: false,
  permissions: [
    'erp.customers.list', 'erp.customers.edit', 'erp.customers.delete',
    'erp.customer-groups.list', 'erp.customer-groups.edit', 'erp.customer-groups.delete',
    'erp.products.list', 'erp.products.edit', 'erp.products.delete',
    'erp.orders.list', 'erp.orders.edit', 'erp.orders.delete',
    'erp.pricing.list', 'erp.pricing.manage',
    'erp.stores.list', 'erp.stores.edit', 'erp.stores.delete',
    'erp.uom.list', 'erp.uom.edit', 'erp.uom.delete',
    'erp.stock.list', 'erp.stock.edit', 'erp.stock.delete',
    'erp.sale-items.list', 'erp.sale-items.manage',
    'erp.hrms.list', 'erp.hrms.edit', 'erp.hrms.delete',
    'erp.departments.list', 'erp.departments.edit', 'erp.departments.delete',
  ],
  meta: { mountPath: '/api/erp' },
  register(app) {
    app.use('/api/erp/dashboard',        dashboardRouter)
    app.use('/api/erp/customers',        customerRouter)
    app.use('/api/erp/customer-groups',  customerGroupRouter)
    app.use('/api/erp/item-master',      productRouter)
    app.use('/api/erp/orders',           orderRouter)
    app.use('/api/erp/pricing',          pricingRouter)
    app.use('/api/erp/product-categories', productCategoryRouter)
    app.use('/api/erp/stores',           storeRouter)
    app.use('/api/erp/uom',              uomRouter)
    app.use('/api/erp/good-receive',     goodReceiveRouter)
    app.use('/api/erp/stock-adjust',     stockAdjustRouter)
    app.use('/api/erp/stock-movements',  stockMovementRouter)
    app.use('/api/erp/stock-request',    stockRequestRouter)
    app.use('/api/erp/stock-count',      stockCountRouter)
    app.use('/api/erp/uom-conversion',   uomConversionRouter)
    app.use('/api/erp/vendors',          vendorRouter)
    app.use('/api/erp/stock-return',     stockReturnRouter)
    app.use('/api/erp/stock-balance',    stockBalanceRouter)
    app.use('/api/erp/sequences',        sequenceRouter)
    app.use('/api/erp/settings/general',    generalSettingsRouter)
    app.use('/api/erp/settings/demo-data', demoDataRouter)
    app.use('/api/erp/stock-issue',      stockIssueRouter)
    app.use('/api/erp/sale-items',       saleItemRouter)
    app.use('/api/erp/hrms/employees',   employeeRouter)
    app.use('/api/erp/hrms/departments', departmentRouter)
  },
})
