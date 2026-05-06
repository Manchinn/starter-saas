import {
  BuildingOffice2Icon,
  UsersIcon,
  CubeIcon,
  ShoppingCartIcon,
  TagIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  BuildingStorefrontIcon,
  ScaleIcon,
  TruckIcon,
  AdjustmentsHorizontalIcon,
  ArrowsRightLeftIcon,
  ArrowPathIcon,
  HomeIcon,
  ClipboardDocumentCheckIcon,
  ArrowUturnRightIcon,
  BuildingLibraryIcon,
  CreditCardIcon,
  ReceiptRefundIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  HashtagIcon,
  CurrencyDollarIcon,
  IdentificationIcon,
  UserGroupIcon,
  SparklesIcon,
  CircleStackIcon,
} from '@heroicons/vue/24/outline'

export default {
  slug: 'erp',
  isCore: false,
  order: 30,
  routes: [
    // Dashboard
    {
      path: '/erp/dashboard',
      name: 'erp-dashboard',
      component: () => import('./dashboard/views/ERPDashboard.vue'),
      meta: { requiresAuth: true, title: 'ERP Dashboard' },
    },
    // Customers
    {
      path: '/erp/customers',
      name: 'erp-customers',
      component: () => import('./customers/views/CustomersList.vue'),
      meta: { requiresAuth: true, title: 'Customers' },
    },
    {
      path: '/erp/customers/create',
      name: 'erp-customers-create',
      component: () => import('./customers/views/CustomerCreate.vue'),
      meta: { requiresAuth: true, title: 'New Customer' },
    },
    {
      path: '/erp/customers/:id/edit',
      name: 'erp-customers-edit',
      component: () => import('./customers/views/CustomerEdit.vue'),
      meta: { requiresAuth: true, title: 'Edit Customer' },
    },
    // Customer Groups
    {
      path: '/erp/customer-groups',
      name: 'erp-customer-groups',
      component: () => import('./customers/views/CustomerGroupsList.vue'),
      meta: { requiresAuth: true, title: 'Customer Groups' },
    },
    {
      path: '/erp/customer-groups/create',
      name: 'erp-customer-groups-create',
      component: () => import('./customers/views/CustomerGroupCreate.vue'),
      meta: { requiresAuth: true, title: 'New Customer Group' },
    },
    {
      path: '/erp/customer-groups/:id/edit',
      name: 'erp-customer-groups-edit',
      component: () => import('./customers/views/CustomerGroupEdit.vue'),
      meta: { requiresAuth: true, title: 'Edit Customer Group' },
    },
    // Product Master
    {
      path: '/erp/item-master',
      name: 'erp-item-master',
      component: () => import('./products/views/ProductsList.vue'),
      meta: { requiresAuth: true, title: 'Product Master' },
    },
    {
      path: '/erp/item-master/create',
      name: 'erp-item-master-create',
      component: () => import('./products/views/ProductCreate.vue'),
      meta: { requiresAuth: true, title: 'New Product Master' },
    },
    {
      path: '/erp/item-master/:id/edit',
      name: 'erp-item-master-edit',
      component: () => import('./products/views/ProductEdit.vue'),
      meta: { requiresAuth: true, title: 'Edit Product Master' },
    },
    // Product Categories
    {
      path: '/erp/product-categories',
      name: 'erp-product-categories',
      component: () => import('./products/views/ProductCategoriesList.vue'),
      meta: { requiresAuth: true, title: 'Product Category' },
    },
    {
      path: '/erp/product-categories/create',
      name: 'erp-product-categories-create',
      component: () => import('./products/views/ProductCategoryCreate.vue'),
      meta: { requiresAuth: true, title: 'New Category' },
    },
    {
      path: '/erp/product-categories/:id/edit',
      name: 'erp-product-categories-edit',
      component: () => import('./products/views/ProductCategoryEdit.vue'),
      meta: { requiresAuth: true, title: 'Edit Category' },
    },
    // Stores
    {
      path: '/erp/stores',
      name: 'erp-stores',
      component: () => import('./inventory/views/StoresList.vue'),
      meta: { requiresAuth: true, title: 'Stores' },
    },
    {
      path: '/erp/stores/create',
      name: 'erp-stores-create',
      component: () => import('./inventory/views/StoreCreate.vue'),
      meta: { requiresAuth: true, title: 'New Store' },
    },
    {
      path: '/erp/stores/:id/edit',
      name: 'erp-stores-edit',
      component: () => import('./inventory/views/StoreEdit.vue'),
      meta: { requiresAuth: true, title: 'Edit Store' },
    },
    // UOM
    {
      path: '/erp/uom',
      name: 'erp-uom',
      component: () => import('./inventory/views/UOMList.vue'),
      meta: { requiresAuth: true, title: 'Units of Measure' },
    },
    {
      path: '/erp/uom/create',
      name: 'erp-uom-create',
      component: () => import('./inventory/views/UOMCreate.vue'),
      meta: { requiresAuth: true, title: 'New UOM' },
    },
    {
      path: '/erp/uom/:id/edit',
      name: 'erp-uom-edit',
      component: () => import('./inventory/views/UOMEdit.vue'),
      meta: { requiresAuth: true, title: 'Edit UOM' },
    },
    // UOM Conversion
    {
      path: '/erp/uom-conversion',
      name: 'erp-uom-conversion',
      component: () => import('./inventory/views/UOMConversionList.vue'),
      meta: { requiresAuth: true, title: 'UOM Conversion' },
    },
    {
      path: '/erp/uom-conversion/create',
      name: 'erp-uom-conversion-create',
      component: () => import('./inventory/views/UOMConversionCreate.vue'),
      meta: { requiresAuth: true, title: 'New UOM Conversion' },
    },
    {
      path: '/erp/uom-conversion/:id/edit',
      name: 'erp-uom-conversion-edit',
      component: () => import('./inventory/views/UOMConversionEdit.vue'),
      meta: { requiresAuth: true, title: 'Edit UOM Conversion' },
    },
    // Vendors
    {
      path: '/erp/vendors',
      name: 'erp-vendors',
      component: () => import('./vendors/views/VendorsList.vue'),
      meta: { requiresAuth: true, title: 'Vendors' },
    },
    {
      path: '/erp/vendors/create',
      name: 'erp-vendors-create',
      component: () => import('./vendors/views/VendorCreate.vue'),
      meta: { requiresAuth: true, title: 'New Vendor' },
    },
    {
      path: '/erp/vendors/:id/edit',
      name: 'erp-vendors-edit',
      component: () => import('./vendors/views/VendorEdit.vue'),
      meta: { requiresAuth: true, title: 'Edit Vendor' },
    },
    // Quotations
    {
      path: '/erp/quotations',
      name: 'erp-quotations',
      component: () => import('./quotations/views/QuotationsList.vue'),
      meta: { requiresAuth: true, title: 'Quotations' },
    },
    {
      path: '/erp/quotations/create',
      name: 'erp-quotations-create',
      component: () => import('./quotations/views/QuotationCreate.vue'),
      meta: { requiresAuth: true, title: 'New Quotation' },
    },
    {
      path: '/erp/quotations/:id',
      name: 'erp-quotations-detail',
      component: () => import('./quotations/views/QuotationDetail.vue'),
      meta: { requiresAuth: true, title: 'Quotation Detail' },
    },
    // Orders
    {
      path: '/erp/orders',
      name: 'erp-orders',
      component: () => import('./orders/views/OrdersList.vue'),
      meta: { requiresAuth: true, title: 'Sales Order' },
    },
    {
      path: '/erp/orders/create',
      name: 'erp-orders-create',
      component: () => import('./orders/views/OrderCreate.vue'),
      meta: { requiresAuth: true, title: 'New Order' },
    },
    {
      path: '/erp/orders/:id',
      name: 'erp-orders-detail',
      component: () => import('./orders/views/OrderDetail.vue'),
      meta: { requiresAuth: true, title: 'Order Detail' },
    },
    // Invoices
    {
      path: '/erp/invoices',
      name: 'erp-invoices',
      component: () => import('./invoices/views/InvoicesList.vue'),
      meta: { requiresAuth: true, title: 'Invoices' },
    },
    {
      path: '/erp/invoices/create',
      name: 'erp-invoices-create',
      component: () => import('./invoices/views/InvoiceCreate.vue'),
      meta: { requiresAuth: true, title: 'New Invoice' },
    },
    {
      path: '/erp/invoices/:id',
      name: 'erp-invoices-detail',
      component: () => import('./invoices/views/InvoiceDetail.vue'),
      meta: { requiresAuth: true, title: 'Invoice Detail' },
    },
    // Receipts
    {
      path: '/erp/receipts',
      name: 'erp-receipts',
      component: () => import('./receipts/views/ReceiptsList.vue'),
      meta: { requiresAuth: true, title: 'Receipts' },
    },
    {
      path: '/erp/receipts/create',
      name: 'erp-receipts-create',
      component: () => import('./receipts/views/ReceiptCreate.vue'),
      meta: { requiresAuth: true, title: 'New Receipt' },
    },
    {
      path: '/erp/receipts/:id',
      name: 'erp-receipts-detail',
      component: () => import('./receipts/views/ReceiptDetail.vue'),
      meta: { requiresAuth: true, title: 'Receipt Detail' },
    },
    // Goods Receive
    {
      path: '/erp/good-receive',
      name: 'erp-good-receive',
      component: () => import('./stock/good-receive/views/GoodReceiveList.vue'),
      meta: { requiresAuth: true, title: 'Goods Receive' },
    },
    {
      path: '/erp/good-receive/create',
      name: 'erp-good-receive-create',
      component: () => import('./stock/good-receive/views/GoodReceiveCreate.vue'),
      meta: { requiresAuth: true, title: 'New Goods Receive' },
    },
    {
      path: '/erp/good-receive/:id',
      name: 'erp-good-receive-detail',
      component: () => import('./stock/good-receive/views/GoodReceiveDetail.vue'),
      meta: { requiresAuth: true, title: 'Goods Receive Detail' },
    },
    // Stock Adjust
    {
      path: '/erp/stock-adjust',
      name: 'erp-stock-adjust',
      component: () => import('./stock/stock-adjust/views/StockAdjustList.vue'),
      meta: { requiresAuth: true, title: 'Stock Adjustment' },
    },
    {
      path: '/erp/stock-adjust/create',
      name: 'erp-stock-adjust-create',
      component: () => import('./stock/stock-adjust/views/StockAdjustCreate.vue'),
      meta: { requiresAuth: true, title: 'New Stock Adjustment' },
    },
    {
      path: '/erp/stock-adjust/:id',
      name: 'erp-stock-adjust-detail',
      component: () => import('./stock/stock-adjust/views/StockAdjustDetail.vue'),
      meta: { requiresAuth: true, title: 'Stock Adjustment Detail' },
    },
    // Stock Balance
    {
      path: '/erp/stock-balance',
      name: 'erp-stock-balance',
      component: () => import('./stock/stock-balance/views/StockBalanceList.vue'),
      meta: { requiresAuth: true, title: 'Stock Balance' },
    },
    {
      path: '/erp/stock-balance/product/:productId',
      name: 'erp-stock-balance-product',
      component: () => import('./stock/stock-balance/views/StockBalanceProduct.vue'),
      meta: { requiresAuth: true, title: 'Stock Balance — Product Overview' },
    },
    // Stock Movements
    {
      path: '/erp/stock-movements',
      name: 'erp-stock-movements',
      component: () => import('./stock/stock-movement/views/StockMovementList.vue'),
      meta: { requiresAuth: true, title: 'Stock Movements' },
    },
    // Stock Count
    {
      path: '/erp/stock-count',
      name: 'erp-stock-count',
      component: () => import('./stock/stock-count/views/StockCountList.vue'),
      meta: { requiresAuth: true, title: 'Stock Count' },
    },
    {
      path: '/erp/stock-count/create',
      name: 'erp-stock-count-create',
      component: () => import('./stock/stock-count/views/StockCountCreate.vue'),
      meta: { requiresAuth: true, title: 'New Stock Count' },
    },
    {
      path: '/erp/stock-count/:id',
      name: 'erp-stock-count-detail',
      component: () => import('./stock/stock-count/views/StockCountDetail.vue'),
      meta: { requiresAuth: true, title: 'Stock Count Detail' },
    },
    // Stock Transfer
    {
      path: '/erp/stock-request',
      name: 'erp-stock-request',
      component: () => import('./stock/stock-request/views/StockRequestList.vue'),
      meta: { requiresAuth: true, title: 'Stock Transfer' },
    },
    {
      path: '/erp/stock-request/create',
      name: 'erp-stock-request-create',
      component: () => import('./stock/stock-request/views/StockRequestCreate.vue'),
      meta: { requiresAuth: true, title: 'New Stock Transfer' },
    },
    {
      path: '/erp/stock-request/:id',
      name: 'erp-stock-request-detail',
      component: () => import('./stock/stock-request/views/StockRequestDetail.vue'),
      meta: { requiresAuth: true, title: 'Stock Transfer Detail' },
    },
    // Stock Return
    {
      path: '/erp/stock-return',
      name: 'erp-stock-return',
      component: () => import('./stock/stock-return/views/StockReturnList.vue'),
      meta: { requiresAuth: true, title: 'Stock Return' },
    },
    {
      path: '/erp/stock-return/create',
      name: 'erp-stock-return-create',
      component: () => import('./stock/stock-return/views/StockReturnCreate.vue'),
      meta: { requiresAuth: true, title: 'New Stock Return' },
    },
    {
      path: '/erp/stock-return/:id',
      name: 'erp-stock-return-detail',
      component: () => import('./stock/stock-return/views/StockReturnDetail.vue'),
      meta: { requiresAuth: true, title: 'Stock Return Detail' },
    },
    // Stock Issue
    {
      path: '/erp/stock-issue',
      name: 'erp-stock-issue',
      component: () => import('./stock/stock-issue/views/StockIssueList.vue'),
      meta: { requiresAuth: true, title: 'Stock Issues' },
    },
    {
      path: '/erp/stock-issue/create',
      name: 'erp-stock-issue-create',
      component: () => import('./stock/stock-issue/views/StockIssueCreate.vue'),
      meta: { requiresAuth: true, title: 'New Stock Issue' },
    },
    {
      path: '/erp/stock-issue/:id',
      name: 'erp-stock-issue-detail',
      component: () => import('./stock/stock-issue/views/StockIssueDetail.vue'),
      meta: { requiresAuth: true, title: 'Stock Issue Detail' },
    },
    // HRMS: Employees
    {
      path: '/erp/hrms/employees',
      name: 'erp-hrms-employees',
      component: () => import('./hrms/views/EmployeesList.vue'),
      meta: { requiresAuth: true, title: 'Employees' },
    },
    {
      path: '/erp/hrms/employees/create',
      name: 'erp-hrms-employees-create',
      component: () => import('./hrms/views/EmployeeCreate.vue'),
      meta: { requiresAuth: true, title: 'New Employee' },
    },
    {
      path: '/erp/hrms/employees/:id/edit',
      name: 'erp-hrms-employees-edit',
      component: () => import('./hrms/views/EmployeeEdit.vue'),
      meta: { requiresAuth: true, title: 'Edit Employee' },
    },
    // HRMS: Departments
    {
      path: '/erp/hrms/departments',
      name: 'erp-hrms-departments',
      component: () => import('./hrms/views/DepartmentsList.vue'),
      meta: { requiresAuth: true, title: 'Departments' },
    },
    {
      path: '/erp/hrms/departments/create',
      name: 'erp-hrms-departments-create',
      component: () => import('./hrms/views/DepartmentCreate.vue'),
      meta: { requiresAuth: true, title: 'New Department' },
    },
    {
      path: '/erp/hrms/departments/:id/edit',
      name: 'erp-hrms-departments-edit',
      component: () => import('./hrms/views/DepartmentEdit.vue'),
      meta: { requiresAuth: true, title: 'Edit Department' },
    },
    // Settings: General
    {
      path: '/erp/settings/general',
      name: 'erp-settings-general',
      component: () => import('./settings/views/GeneralSettings.vue'),
      meta: { requiresAuth: true, title: 'General Settings' },
    },
    // Settings: Sequence Numbers
    {
      path: '/erp/settings/sequence',
      name: 'erp-settings-sequence',
      component: () => import('./settings/views/SequenceList.vue'),
      meta: { requiresAuth: true, title: 'Sequence Numbers' },
    },
    {
      path: '/erp/settings/sequence/create',
      name: 'erp-settings-sequence-create',
      component: () => import('./settings/views/SequenceEdit.vue'),
      meta: { requiresAuth: true, title: 'New Sequence' },
    },
    {
      path: '/erp/settings/sequence/:id/edit',
      name: 'erp-settings-sequence-edit',
      component: () => import('./settings/views/SequenceEdit.vue'),
      meta: { requiresAuth: true, title: 'Edit Sequence' },
    },
    // Sale Items
    {
      path: '/erp/sale-items',
      name: 'erp-sale-items',
      component: () => import('./sale/views/SaleItemsList.vue'),
      meta: { requiresAuth: true, title: 'Sale Items' },
    },
    {
      path: '/erp/sale-items/create',
      name: 'erp-sale-items-create',
      component: () => import('./sale/views/SaleItemCreate.vue'),
      meta: { requiresAuth: true, title: 'New Sale Item' },
    },
    {
      path: '/erp/sale-items/:id/edit',
      name: 'erp-sale-items-edit',
      component: () => import('./sale/views/SaleItemEdit.vue'),
      meta: { requiresAuth: true, title: 'Edit Sale Item' },
    },
    // Price Lists
    {
      path: '/erp/pricing',
      name: 'erp-pricing',
      component: () => import('./pricing/views/PricingList.vue'),
      meta: { requiresAuth: true, title: 'Price Lists' },
    },
    {
      path: '/erp/pricing/create',
      name: 'erp-pricing-create',
      component: () => import('./pricing/views/PricingCreate.vue'),
      meta: { requiresAuth: true, title: 'New Price List' },
    },
    {
      path: '/erp/pricing/:id/edit',
      name: 'erp-pricing-edit',
      component: () => import('./pricing/views/PricingEdit.vue'),
      meta: { requiresAuth: true, title: 'Edit Price List' },
    },
    // Settings — Demo Data
    {
      path: '/erp/settings/demo-data',
      name: 'erp-settings-demo-data',
      component: () => import('./settings/views/DemoData.vue'),
      meta: { requiresAuth: true, title: 'Demo Data' },
    },
    // Settings — Master Data
    {
      path: '/erp/settings/master-data',
      name: 'erp-settings-master-data',
      component: () => import('./settings/views/MasterDataList.vue'),
      meta: { requiresAuth: true, title: 'Master Data' },
    },
    {
      path: '/erp/settings/master-data/create',
      name: 'erp-settings-master-data-create',
      component: () => import('./settings/views/MasterDataCreate.vue'),
      meta: { requiresAuth: true, title: 'New Master Data Category' },
    },
    {
      path: '/erp/settings/master-data/:id',
      name: 'erp-settings-master-data-edit',
      component: () => import('./settings/views/MasterDataEdit.vue'),
      meta: { requiresAuth: true, title: 'Edit Master Data Category' },
    },
  ],
  navItem: {
    label: 'nav.erp',
    icon: BuildingOffice2Icon,
    children: [
      { label: 'nav.erpDashboard', to: '/erp/dashboard', icon: HomeIcon },
      {
        label: 'nav.customers',
        icon: UsersIcon,
        children: [
          { label: 'nav.customers',      to: '/erp/customers',       icon: UsersIcon,    permission: 'erp.customers.list' },
          { label: 'nav.customerGroups', to: '/erp/customer-groups', icon: TagIcon,      permission: 'erp.customer-groups.list' },
        ],
      },
      { label: 'nav.vendors', to: '/erp/vendors', icon: BuildingLibraryIcon, permission: 'erp.products.list' },
      {
        label: 'nav.inventory',
        icon: CubeIcon,
        children: [
          { label: 'nav.productCategory', to: '/erp/product-categories', icon: TagIcon,                   permission: 'erp.products.list' },
          { label: 'nav.productMaster',   to: '/erp/item-master',        icon: CubeIcon,                  permission: 'erp.products.list' },
          { label: 'nav.stores',          to: '/erp/stores',             icon: BuildingStorefrontIcon,     permission: 'erp.stores.list' },
          { label: 'nav.uom',             to: '/erp/uom',                icon: ScaleIcon,                 permission: 'erp.uom.list' },
          { label: 'nav.uomConversion',   to: '/erp/uom-conversion',     icon: ArrowUturnRightIcon,       permission: 'erp.uom.list' },
          { label: 'nav.goodsReceive',    to: '/erp/good-receive',       icon: TruckIcon,                 permission: 'erp.stock.list' },
          { label: 'nav.stockAdjustment', to: '/erp/stock-adjust',       icon: AdjustmentsHorizontalIcon, permission: 'erp.stock.list' },
          { label: 'nav.stockCount',      to: '/erp/stock-count',        icon: ClipboardDocumentCheckIcon, permission: 'erp.stock.list' },
          { label: 'nav.stockTransfer',   to: '/erp/stock-request',      icon: ArrowPathIcon,             permission: 'erp.stock.list' },
          { label: 'nav.stockReturn',     to: '/erp/stock-return',       icon: ReceiptRefundIcon,         permission: 'erp.stock.list' },
          { label: 'nav.stockIssue',      to: '/erp/stock-issue',        icon: ArrowPathIcon,             permission: 'erp.stock.list' },
          { label: 'nav.stockBalance',    to: '/erp/stock-balance',      icon: ChartBarIcon,              permission: 'erp.stock.list' },
          { label: 'nav.stockMovement',   to: '/erp/stock-movements',    icon: ArrowsRightLeftIcon,       permission: 'erp.stock.list' },
        ],
      },
      {
        label: 'nav.sales',
        icon: ShoppingCartIcon,
        children: [
          { label: 'nav.saleItems',    to: '/erp/sale-items',  icon: ClipboardDocumentListIcon, permission: 'erp.sale-items.list' },
          { label: 'nav.priceLists',   to: '/erp/pricing',     icon: TagIcon,                   permission: 'erp.pricing.list' },
          { label: 'nav.quotations',   to: '/erp/quotations',  icon: DocumentTextIcon,          permission: 'erp.quotations.list' },
          { label: 'nav.salesOrder',   to: '/erp/orders',      icon: ShoppingCartIcon,          permission: 'erp.orders.list' },
        ],
      },
      {
        label: 'nav.billing',
        icon: CreditCardIcon,
        children: [
          { label: 'nav.invoices', to: '/erp/invoices', icon: DocumentTextIcon,  permission: 'erp.invoices.list' },
          { label: 'nav.receipts', to: '/erp/receipts', icon: ReceiptRefundIcon, permission: 'erp.receipts.list' },
        ],
      },
      {
        label: 'nav.hrms',
        icon: UserGroupIcon,
        children: [
          { label: 'nav.employees',   to: '/erp/hrms/employees',   icon: IdentificationIcon, permission: 'erp.hrms.list' },
          { label: 'nav.departments', to: '/erp/hrms/departments', icon: UserGroupIcon,      permission: 'erp.departments.list' },
        ],
      },
      {
        label: 'nav.settings',
        icon: Cog6ToothIcon,
        children: [
          { label: 'nav.general',         to: '/erp/settings/general',       icon: CurrencyDollarIcon, permission: 'erp.stock.edit' },
          { label: 'nav.sequenceNumbers', to: '/erp/settings/sequence',    icon: HashtagIcon,        permission: 'erp.stock.edit' },
          { label: 'nav.masterData',      to: '/erp/settings/master-data', icon: CircleStackIcon,    permission: 'erp.stock.edit' },
          { label: 'nav.demoData',        to: '/erp/settings/demo-data',   icon: SparklesIcon,       permission: 'erp.stock.edit' },
        ],
      },
    ],
  },
}
