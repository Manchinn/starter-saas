const fs = require('fs')
const path = require('path')
const defineModule = require('../../server/core/module')

const API_PREFIX = '/api/erp'

const findRouteFiles = (dir) => {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...findRouteFiles(full))
    else if (entry.isFile() && entry.name.endsWith('.routes.js')) out.push(full)
  }
  return out
}

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
    'erp.tax-periods.list', 'erp.tax-periods.edit',
  ],
  meta: { mountPath: API_PREFIX },
  register(app) {
    const seen = new Map()
    for (const file of findRouteFiles(__dirname)) {
      const mod = require(file)
      const { mountPath, router } = mod || {}
      if (!mountPath || typeof router !== 'function') {
        throw new Error(`ERP route file ${path.relative(__dirname, file)} must export { mountPath, router }`)
      }
      if (seen.has(mountPath)) {
        throw new Error(`ERP mount path conflict at ${mountPath}: ${seen.get(mountPath)} vs ${path.relative(__dirname, file)}`)
      }
      seen.set(mountPath, path.relative(__dirname, file))
      app.use(`${API_PREFIX}${mountPath}`, router)
    }
  },
})
