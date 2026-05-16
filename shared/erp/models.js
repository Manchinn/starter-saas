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

// ── Quotations ───────────────────────────────────────────────────────────────
const Quotation      = require('./quotations/models/quotation.model')
const QuotationItem  = require('./quotations/models/quotation-item.model')

// ── Orders ───────────────────────────────────────────────────────────────────
const Order               = require('./orders/models/order.model')
const SalesOrderItem      = require('./orders/models/sales-order-item.model')
const DeliveryOrder       = require('./orders/models/delivery-order.model')
const DeliveryOrderItem   = require('./orders/models/delivery-order-item.model')

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
const SaleItem        = require('./sale/models/sale-item.model')
const SalePackage     = require('./sale/models/sale-package.model')
const SalePackageItem = require('./sale/models/sale-package-item.model')

// ── Invoices ─────────────────────────────────────────────────────────────────
const Invoice     = require('./invoices/models/invoice.model')
const InvoiceItem = require('./invoices/models/invoice-item.model')

// ── Receipts ─────────────────────────────────────────────────────────────────
const Receipt = require('./receipts/models/receipt.model')

// ── HRMS ─────────────────────────────────────────────────────────────────────
const Employee           = require('./hrms/models/employee.model')
const Department         = require('./hrms/models/department.model')
const EmployeeDepartment = require('./hrms/models/employee-department.model')

// ── Settings ─────────────────────────────────────────────────────────────────
const Sequence           = require('./settings/models/sequence.model')
const Setting            = require('./settings/models/setting.model')
const MasterDataCategory = require('./settings/models/master-data-category.model')
const MasterDataValue    = require('./settings/models/master-data-value.model')
const ApprovalThreshold  = require('./settings/models/approval-threshold.model')
const Attachment         = require('./attachments/models/attachment.model')
const AuditLog           = require('./audit/models/audit-log.model')

// ── Accounting ────────────────────────────────────────────────────────────────
const ChartOfAccount     = require('./accounting/models/chart-of-account.model')
const FiscalYear         = require('./accounting/models/fiscal-year.model')
const BillingNote        = require('./accounting/models/billing-note.model')
const BillingNoteInvoice = require('./accounting/models/billing-note-invoice.model')
const DebitNote              = require('./accounting/models/debit-note.model')
const CreditNote             = require('./accounting/models/credit-note.model')
const ReceivePayment         = require('./accounting/models/receive-payment.model')
const ReceivePaymentInvoice  = require('./accounting/models/receive-payment-invoice.model')
const Journal                = require('./accounting/models/journal.model')
const JournalLine            = require('./accounting/models/journal-line.model')
const VendorBill             = require('./accounting/models/vendor-bill.model')
const VendorBillItem         = require('./accounting/models/vendor-bill-item.model')

// ── Purchasing ────────────────────────────────────────────────────────────────
const PurchaseRequisition     = require('./purchasing/models/purchase-requisition.model')
const PurchaseRequisitionItem = require('./purchasing/models/purchase-requisition-item.model')
const PurchaseOrder           = require('./purchasing/models/purchase-order.model')
const PurchaseOrderItem       = require('./purchasing/models/purchase-order-item.model')

// ── Collect ───────────────────────────────────────────────────────────────────
const erpModels = {
  Item,
  Customer, CustomerGroup,
  Product, ProductCategory, ProductStore, ProductVendor,
  Quotation, QuotationItem,
  Order, SalesOrderItem,
  DeliveryOrder, DeliveryOrderItem,
  Invoice, InvoiceItem,
  Receipt,
  SaleItem, SalePackage, SalePackageItem,
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
  MasterDataCategory, MasterDataValue,
  ApprovalThreshold,
  Attachment,
  AuditLog,
  Employee, Department, EmployeeDepartment,
  ChartOfAccount, FiscalYear,
  BillingNote, BillingNoteInvoice,
  DebitNote, CreditNote,
  ReceivePayment, ReceivePaymentInvoice,
  Journal, JournalLine,
  VendorBill, VendorBillItem,
  PurchaseRequisition, PurchaseRequisitionItem,
  PurchaseOrder, PurchaseOrderItem,
}

// ── Intra-ERP associations ────────────────────────────────────────────────────
require('./customers/models/customerAssociations')(erpModels)
require('./quotations/models/quotationAssociations')(erpModels)
require('./orders/models/orderAssociations')(erpModels)
require('./orders/models/deliveryOrderAssociations')(erpModels)
require('./invoices/models/invoiceAssociations')(erpModels)
require('./receipts/models/receiptAssociations')(erpModels)
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

MasterDataCategory.hasMany(MasterDataValue, { foreignKey: 'categoryId', as: 'values', onDelete: 'CASCADE' })
MasterDataValue.belongsTo(MasterDataCategory, { foreignKey: 'categoryId', as: 'category' })

ChartOfAccount.belongsTo(ChartOfAccount, { foreignKey: 'parentId', as: 'parent' })
ChartOfAccount.hasMany(ChartOfAccount, { foreignKey: 'parentId', as: 'children' })

require('./accounting/models/billingNoteAssociations')({ BillingNote, BillingNoteInvoice, Invoice, Customer })
require('./accounting/models/debitNoteAssociations')({ DebitNote, Invoice, Customer })
require('./accounting/models/creditNoteAssociations')({ CreditNote, Invoice, Customer })
require('./accounting/models/receivePaymentAssociations')({ ReceivePayment, ReceivePaymentInvoice, Invoice, Customer })
require('./accounting/models/journalAssociations')({ Journal, JournalLine, ChartOfAccount })

require('./purchasing/models/purchaseRequisitionAssociations')({ PurchaseRequisition, PurchaseRequisitionItem, Product, Vendor })
require('./purchasing/models/purchaseOrderAssociations')({ PurchaseOrder, PurchaseOrderItem, Product, Vendor, PurchaseRequisition })
require('./sale/models/salePackageAssociations')({ SalePackage, SalePackageItem, SaleItem })
require('./accounting/models/vendorBillAssociations')({ VendorBill, VendorBillItem, Vendor, PurchaseOrder, GoodReceive })

module.exports = erpModels
