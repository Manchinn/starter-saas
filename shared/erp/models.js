/**
 * ERP model registry.
 * Collects every ERP domain model, wires intra-ERP associations,
 * and exports a flat object ready to be merged into the full model registry.
 *
 * Cross-domain associations that reference core server models (e.g. User)
 * are handled in server/models/index.js after the merge.
 */

// ── Customers ────────────────────────────────────────────────────────────────
const Customer      = require('./customers/models/customer.model')
const CustomerGroup = require('./customers/models/customer-group.model')

// ── Products ─────────────────────────────────────────────────────────────────
const Item            = require('./products/models/item.model')
const Product         = require('./products/models/product.model')
const ProductCategory = require('./products/models/product-category.model')
const ProductStore    = require('./products/models/product-store.model')
const ProductVendor   = require('./products/models/product-vendor.model')

// ── Orders ───────────────────────────────────────────────────────────────────
const Order          = require('./orders/models/order.model')
const SalesOrderItem = require('./orders/models/sales-order-item.model')

// ── Pricing ──────────────────────────────────────────────────────────────────
const Pricing = require('./pricing/models/pricing.model')

// ── Inventory ────────────────────────────────────────────────────────────────
const Store         = require('./inventory/models/store.model')
const StoreStock    = require('./inventory/models/store-stock.model')
const UOM           = require('./inventory/models/uom.model')
const UOMConversion = require('./inventory/models/uom-conversion.model')

// ── Vendors ──────────────────────────────────────────────────────────────────
const Vendor = require('./vendors/models/vendor.model')

// ── Stock ────────────────────────────────────────────────────────────────────
const GoodReceive      = require('./stock/good-receive/models/good-receive.model')
const GoodReceiveItem  = require('./stock/good-receive/models/good-receive-item.model')
const StockAdjust      = require('./stock/stock-adjust/models/stock-adjust.model')
const StockAdjustItem  = require('./stock/stock-adjust/models/stock-adjust-item.model')
const StockMovement    = require('./stock/stock-movement/models/stock-movement.model')
const StockRequest     = require('./stock/stock-request/models/stock-request.model')
const StockRequestItem = require('./stock/stock-request/models/stock-request-item.model')
const StockCount       = require('./stock/stock-count/models/stock-count.model')
const StockCountItem   = require('./stock/stock-count/models/stock-count-item.model')
const StockReturn      = require('./stock/stock-return/models/stock-return.model')
const StockReturnItem  = require('./stock/stock-return/models/stock-return-item.model')
const StockIssue       = require('./stock/stock-issue/models/stock-issue.model')
const StockIssueItem   = require('./stock/stock-issue/models/stock-issue-item.model')

// ── Sale ─────────────────────────────────────────────────────────────────────
const SaleItem = require('./sale/models/sale-item.model')

// ── HRMS ─────────────────────────────────────────────────────────────────────
const Employee           = require('./hrms/models/employee.model')
const Department         = require('./hrms/models/department.model')
const EmployeeDepartment = require('./hrms/models/employee-department.model')

// ── Settings ─────────────────────────────────────────────────────────────────
const Sequence = require('./settings/models/sequence.model')
const Setting  = require('./settings/models/setting.model')

// ── Collect ───────────────────────────────────────────────────────────────────
const erpModels = {
  Item,
  Customer, CustomerGroup,
  Product, ProductCategory, ProductStore, ProductVendor,
  Order, SalesOrderItem,
  SaleItem,
  Pricing,
  Store, StoreStock,
  UOM, UOMConversion,
  Vendor,
  GoodReceive, GoodReceiveItem,
  StockAdjust, StockAdjustItem,
  StockMovement,
  StockRequest, StockRequestItem,
  StockCount, StockCountItem,
  StockReturn, StockReturnItem,
  StockIssue, StockIssueItem,
  Sequence, Setting,
  Employee, Department, EmployeeDepartment,
}

// ── Intra-ERP associations ────────────────────────────────────────────────────
require('./customers/models/customerAssociations')(erpModels)
require('./orders/models/orderAssociations')(erpModels)
require('./pricing/models/pricingAssociations')(erpModels)
require('./products/models/productAssociations')(erpModels)
require('./inventory/models/inventoryAssociations')(erpModels)
require('./stock/good-receive/models/goodReceiveAssociations')(erpModels)
require('./stock/stock-adjust/models/stockAdjustAssociations')(erpModels)
require('./stock/stock-movement/models/stockMovementAssociations')(erpModels)
require('./stock/stock-request/models/stockRequestAssociations')(erpModels)
require('./stock/stock-count/models/stockCountAssociations')(erpModels)
require('./stock/stock-issue/models/stockIssueAssociations')(erpModels)
require('./stock/stock-return/models/stockReturnAssociations')(erpModels)

module.exports = erpModels
