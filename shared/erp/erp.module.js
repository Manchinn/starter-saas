const defineModule = require('../../server/core/module')
const quotationRouter       = require('./quotations/quotation.routes')
const customerRouter        = require('./customers/customer.routes')
const customerGroupRouter   = require('./customers/customer-group.routes')
const productRouter         = require('./products/product.routes')
const orderRouter           = require('./orders/order.routes')
const deliveryOrderRouter   = require('./orders/delivery-order.routes')
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
const masterDataRouter      = require('./settings/master-data.routes')
const stockIssueRouter      = require('./stock/stock-issue/stock-issue.routes')
const invoiceRouter         = require('./invoices/invoice.routes')
const receiptRouter         = require('./receipts/receipt.routes')
const saleItemRouter        = require('./sale/sale-item.routes')
const employeeRouter           = require('./hrms/employee.routes')
const departmentRouter         = require('./hrms/department.routes')
const chartOfAccountRouter        = require('./accounting/routes/chart-of-account.routes')
const billingNoteRouter           = require('./accounting/routes/billing-note.routes')
const fiscalYearRouter            = require('./accounting/routes/fiscal-year.routes')
const debitNoteRouter             = require('./accounting/routes/debit-note.routes')
const creditNoteRouter            = require('./accounting/routes/credit-note.routes')
const receivePaymentRouter        = require('./accounting/routes/receive-payment.routes')
const journalRouter               = require('./accounting/routes/journal.routes')
const purchaseRequisitionRouter   = require('./purchasing/purchase-requisition.routes')
const purchaseOrderRouter         = require('./purchasing/purchase-order.routes')
const arAgingRouter               = require('./accounting/routes/ar-aging.routes')
const salePackageRouter           = require('./sale/sale-package.routes')
const vendorBillRouter            = require('./accounting/routes/vendor-bill.routes')
const approvalThresholdRouter     = require('./settings/approval-threshold.routes')
const attachmentRouter            = require('./attachments/attachment.routes')
const auditLogRouter              = require('./audit/audit.routes')
const currencyRouter              = require('./settings/currency.routes')

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
    'erp.quotations.list', 'erp.quotations.edit', 'erp.quotations.delete',
    'erp.sale-items.list', 'erp.sale-items.manage',
    'erp.hrms.list', 'erp.hrms.edit', 'erp.hrms.delete',
    'erp.departments.list', 'erp.departments.edit', 'erp.departments.delete',
    'erp.invoices.list', 'erp.invoices.edit', 'erp.invoices.delete',
    'erp.receipts.list', 'erp.receipts.edit', 'erp.receipts.delete',
    'erp.accounting.list', 'erp.accounting.edit', 'erp.accounting.delete',
    'erp.purchasing.list', 'erp.purchasing.edit', 'erp.purchasing.delete',
    'erp.sale-packages.list', 'erp.sale-packages.manage',
    'erp.bills.list', 'erp.bills.edit', 'erp.bills.delete', 'erp.bills.approve',
    'erp.purchasing.approve',
    'erp.thresholds.list', 'erp.thresholds.edit',
    'erp.audit.list',
    'erp.currencies.list', 'erp.currencies.edit',
  ],
  meta: { mountPath: '/api/erp' },
  register(app) {
    app.use('/api/erp/quotations',        quotationRouter)
    app.use('/api/erp/dashboard',        dashboardRouter)
    app.use('/api/erp/customers',        customerRouter)
    app.use('/api/erp/customer-groups',  customerGroupRouter)
    app.use('/api/erp/item-master',      productRouter)
    app.use('/api/erp/orders',           orderRouter)
    app.use('/api/erp/delivery-orders',  deliveryOrderRouter)
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
    app.use('/api/erp/master-data',        masterDataRouter)
    app.use('/api/erp/stock-issue',      stockIssueRouter)
    app.use('/api/erp/invoices',         invoiceRouter)
    app.use('/api/erp/receipts',         receiptRouter)
    app.use('/api/erp/sale-items',       saleItemRouter)
    app.use('/api/erp/hrms/employees',   employeeRouter)
    app.use('/api/erp/hrms/departments', departmentRouter)
    app.use('/api/erp/accounting/chart-of-accounts', chartOfAccountRouter)
    app.use('/api/erp/accounting/fiscal-years',       fiscalYearRouter)
    app.use('/api/erp/billing/billing-notes',        billingNoteRouter)
    app.use('/api/erp/billing/debit-notes',          debitNoteRouter)
    app.use('/api/erp/billing/credit-notes',         creditNoteRouter)
    app.use('/api/erp/billing/receive-payments',     receivePaymentRouter)
    app.use('/api/erp/accounting/journals',          journalRouter)
    app.use('/api/erp/purchasing/requisitions',      purchaseRequisitionRouter)
    app.use('/api/erp/purchasing/orders',            purchaseOrderRouter)
    app.use('/api/erp/accounting/ar-aging',          arAgingRouter)
    app.use('/api/erp/sale-packages',               salePackageRouter)
    app.use('/api/erp/purchasing/bills',            vendorBillRouter)
    app.use('/api/erp/settings/approval-thresholds', approvalThresholdRouter)
    app.use('/api/erp/attachments',                  attachmentRouter)
    app.use('/api/erp/audit-log',                    auditLogRouter)
    app.use('/api/erp/settings/currencies',          currencyRouter)
  },
})
