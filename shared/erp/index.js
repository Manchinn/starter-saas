import {
  BuildingOffice2Icon,
  UsersIcon,
  CubeIcon,
  ShoppingCartIcon,
  ListBulletIcon,
  TagIcon,
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
  ReceiptRefundIcon,
  ChartBarIcon,
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
      component: () => import('./views/ERPDashboard.vue'),
      meta: { requiresAuth: true, title: 'ERP Dashboard' },
    },
    // Customers
    {
      path: '/erp/customers',
      name: 'erp-customers',
      component: () => import('./views/customers/CustomersList.vue'),
      meta: { requiresAuth: true, title: 'Customers' },
    },
    {
      path: '/erp/customers/create',
      name: 'erp-customers-create',
      component: () => import('./views/customers/CustomerCreate.vue'),
      meta: { requiresAuth: true, title: 'New Customer' },
    },
    {
      path: '/erp/customers/:id/edit',
      name: 'erp-customers-edit',
      component: () => import('./views/customers/CustomerEdit.vue'),
      meta: { requiresAuth: true, title: 'Edit Customer' },
    },
    // Product Master
    {
      path: '/erp/item-master',
      name: 'erp-item-master',
      component: () => import('./views/products/ProductsList.vue'),
      meta: { requiresAuth: true, title: 'Product Master' },
    },
    {
      path: '/erp/item-master/create',
      name: 'erp-item-master-create',
      component: () => import('./views/products/ProductCreate.vue'),
      meta: { requiresAuth: true, title: 'New Product Master' },
    },
    {
      path: '/erp/item-master/:id/edit',
      name: 'erp-item-master-edit',
      component: () => import('./views/products/ProductEdit.vue'),
      meta: { requiresAuth: true, title: 'Edit Product Master' },
    },
    // Product Categories
    {
      path: '/erp/product-categories',
      name: 'erp-product-categories',
      component: () => import('./views/products/ProductCategoriesList.vue'),
      meta: { requiresAuth: true, title: 'Product Categories' },
    },
    {
      path: '/erp/product-categories/create',
      name: 'erp-product-categories-create',
      component: () => import('./views/products/ProductCategoryCreate.vue'),
      meta: { requiresAuth: true, title: 'New Category' },
    },
    // Stores
    {
      path: '/erp/stores',
      name: 'erp-stores',
      component: () => import('./views/stores/StoresList.vue'),
      meta: { requiresAuth: true, title: 'Stores' },
    },
    {
      path: '/erp/stores/create',
      name: 'erp-stores-create',
      component: () => import('./views/stores/StoreCreate.vue'),
      meta: { requiresAuth: true, title: 'New Store' },
    },
    {
      path: '/erp/stores/:id/edit',
      name: 'erp-stores-edit',
      component: () => import('./views/stores/StoreEdit.vue'),
      meta: { requiresAuth: true, title: 'Edit Store' },
    },
    // UOM
    {
      path: '/erp/uom',
      name: 'erp-uom',
      component: () => import('./views/uom/UOMList.vue'),
      meta: { requiresAuth: true, title: 'Units of Measure' },
    },
    {
      path: '/erp/uom/create',
      name: 'erp-uom-create',
      component: () => import('./views/uom/UOMCreate.vue'),
      meta: { requiresAuth: true, title: 'New UOM' },
    },
    {
      path: '/erp/uom/:id/edit',
      name: 'erp-uom-edit',
      component: () => import('./views/uom/UOMEdit.vue'),
      meta: { requiresAuth: true, title: 'Edit UOM' },
    },
    // UOM Conversion
    {
      path: '/erp/uom-conversion',
      name: 'erp-uom-conversion',
      component: () => import('./views/uom/UOMConversionList.vue'),
      meta: { requiresAuth: true, title: 'UOM Conversion' },
    },
    // Vendors
    {
      path: '/erp/vendors',
      name: 'erp-vendors',
      component: () => import('./views/vendors/VendorsList.vue'),
      meta: { requiresAuth: true, title: 'Vendors' },
    },
    {
      path: '/erp/vendors/create',
      name: 'erp-vendors-create',
      component: () => import('./views/vendors/VendorCreate.vue'),
      meta: { requiresAuth: true, title: 'New Vendor' },
    },
    {
      path: '/erp/vendors/:id/edit',
      name: 'erp-vendors-edit',
      component: () => import('./views/vendors/VendorEdit.vue'),
      meta: { requiresAuth: true, title: 'Edit Vendor' },
    },
    // Orders
    {
      path: '/erp/orders',
      name: 'erp-orders',
      component: () => import('./views/orders/OrdersList.vue'),
      meta: { requiresAuth: true, title: 'Orders' },
    },
    {
      path: '/erp/sale-items',
      name: 'erp-sale-items',
      component: () => import('./views/orders/OrderItemsList.vue'),
      meta: { requiresAuth: true, title: 'Sale Items' },
    },
    {
      path: '/erp/orders/create',
      name: 'erp-orders-create',
      component: () => import('./views/orders/OrderCreate.vue'),
      meta: { requiresAuth: true, title: 'New Order' },
    },
    {
      path: '/erp/orders/:id',
      name: 'erp-orders-detail',
      component: () => import('./views/orders/OrderDetail.vue'),
      meta: { requiresAuth: true, title: 'Order Detail' },
    },
    // Good Receive
    {
      path: '/erp/good-receive',
      name: 'erp-good-receive',
      component: () => import('./views/stock/GoodReceiveList.vue'),
      meta: { requiresAuth: true, title: 'Good Receive' },
    },
    {
      path: '/erp/good-receive/create',
      name: 'erp-good-receive-create',
      component: () => import('./views/stock/GoodReceiveCreate.vue'),
      meta: { requiresAuth: true, title: 'New Good Receive' },
    },
    {
      path: '/erp/good-receive/:id',
      name: 'erp-good-receive-detail',
      component: () => import('./views/stock/GoodReceiveDetail.vue'),
      meta: { requiresAuth: true, title: 'Good Receive Detail' },
    },
    // Stock Adjust
    {
      path: '/erp/stock-adjust',
      name: 'erp-stock-adjust',
      component: () => import('./views/stock/StockAdjustList.vue'),
      meta: { requiresAuth: true, title: 'Stock Adjustment' },
    },
    {
      path: '/erp/stock-adjust/create',
      name: 'erp-stock-adjust-create',
      component: () => import('./views/stock/StockAdjustCreate.vue'),
      meta: { requiresAuth: true, title: 'New Stock Adjustment' },
    },
    {
      path: '/erp/stock-adjust/:id',
      name: 'erp-stock-adjust-detail',
      component: () => import('./views/stock/StockAdjustDetail.vue'),
      meta: { requiresAuth: true, title: 'Stock Adjustment Detail' },
    },
    // Stock Balance
    {
      path: '/erp/stock-balance',
      name: 'erp-stock-balance',
      component: () => import('./views/stock/StockBalanceList.vue'),
      meta: { requiresAuth: true, title: 'Stock Balance' },
    },
    {
      path: '/erp/stock-balance/product/:productId',
      name: 'erp-stock-balance-product',
      component: () => import('./views/stock/StockBalanceProduct.vue'),
      meta: { requiresAuth: true, title: 'Stock Balance — Product Overview' },
    },
    // Stock Movements
    {
      path: '/erp/stock-movements',
      name: 'erp-stock-movements',
      component: () => import('./views/stock/StockMovementList.vue'),
      meta: { requiresAuth: true, title: 'Stock Movements' },
    },
    // Stock Count
    {
      path: '/erp/stock-count',
      name: 'erp-stock-count',
      component: () => import('./views/stock/StockCountList.vue'),
      meta: { requiresAuth: true, title: 'Stock Count' },
    },
    {
      path: '/erp/stock-count/create',
      name: 'erp-stock-count-create',
      component: () => import('./views/stock/StockCountCreate.vue'),
      meta: { requiresAuth: true, title: 'New Stock Count' },
    },
    {
      path: '/erp/stock-count/:id',
      name: 'erp-stock-count-detail',
      component: () => import('./views/stock/StockCountDetail.vue'),
      meta: { requiresAuth: true, title: 'Stock Count Detail' },
    },
    // Stock Request
    {
      path: '/erp/stock-request',
      name: 'erp-stock-request',
      component: () => import('./views/stock/StockRequestList.vue'),
      meta: { requiresAuth: true, title: 'Stock Request' },
    },
    {
      path: '/erp/stock-request/create',
      name: 'erp-stock-request-create',
      component: () => import('./views/stock/StockRequestCreate.vue'),
      meta: { requiresAuth: true, title: 'New Stock Request' },
    },
    {
      path: '/erp/stock-request/:id',
      name: 'erp-stock-request-detail',
      component: () => import('./views/stock/StockRequestDetail.vue'),
      meta: { requiresAuth: true, title: 'Stock Request Detail' },
    },
    // Stock Return
    {
      path: '/erp/stock-return',
      name: 'erp-stock-return',
      component: () => import('./views/stock/StockReturnList.vue'),
      meta: { requiresAuth: true, title: 'Stock Return' },
    },
    {
      path: '/erp/stock-return/create',
      name: 'erp-stock-return-create',
      component: () => import('./views/stock/StockReturnCreate.vue'),
      meta: { requiresAuth: true, title: 'New Stock Return' },
    },
    {
      path: '/erp/stock-return/:id',
      name: 'erp-stock-return-detail',
      component: () => import('./views/stock/StockReturnDetail.vue'),
      meta: { requiresAuth: true, title: 'Stock Return Detail' },
    },
    // Pricing
    {
      path: '/erp/pricing',
      name: 'erp-pricing',
      component: () => import('./views/pricing/PricingList.vue'),
      meta: { requiresAuth: true, title: 'Pricing' },
    },
    {
      path: '/erp/pricing/create',
      name: 'erp-pricing-create',
      component: () => import('./views/pricing/PricingCreate.vue'),
      meta: { requiresAuth: true, title: 'New Pricing' },
    },
  ],
  navItem: {
    label: 'ERP',
    icon: BuildingOffice2Icon,
    children: [
      { label: 'Dashboard', to: '/erp/dashboard', icon: HomeIcon, permission: 'erp.products.list' },
      {
        label: 'Customers',
        icon: UsersIcon,
        children: [
          { label: 'Customers', to: '/erp/customers', icon: UsersIcon, permission: 'erp.customers.list' },
        ],
      },
      {
        label: 'Inventory',
        icon: CubeIcon,
        children: [
          { label: 'Product Master',   to: '/erp/item-master',        icon: CubeIcon,                       permission: 'erp.products.list' },
          { label: 'Product Category', to: '/erp/product-categories', icon: TagIcon,                       permission: 'erp.products.list' },
          { label: 'Vendors',          to: '/erp/vendors',            icon: BuildingLibraryIcon,            permission: 'erp.products.list' },
          { label: 'Stores',           to: '/erp/stores',             icon: BuildingStorefrontIcon,         permission: 'erp.stores.list' },
          { label: 'UOM',              to: '/erp/uom',                icon: ScaleIcon,                     permission: 'erp.uom.list' },
          { label: 'UOM Conversion',   to: '/erp/uom-conversion',     icon: ArrowUturnRightIcon,           permission: 'erp.uom.list' },
          { label: 'Good Receive',     to: '/erp/good-receive',       icon: TruckIcon,                  permission: 'erp.stock.list' },
          { label: 'Stock Adjustment', to: '/erp/stock-adjust',       icon: AdjustmentsHorizontalIcon,    permission: 'erp.stock.list' },
          { label: 'Stock Count',      to: '/erp/stock-count',        icon: ClipboardDocumentCheckIcon,  permission: 'erp.stock.list' },
          { label: 'Stock Request',    to: '/erp/stock-request',      icon: ArrowPathIcon,               permission: 'erp.stock.list' },
          { label: 'Stock Return',     to: '/erp/stock-return',       icon: ReceiptRefundIcon,           permission: 'erp.stock.list' },
          { label: 'Stock Balance',    to: '/erp/stock-balance',      icon: ChartBarIcon,                permission: 'erp.stock.list' },
          { label: 'Stock Movement',   to: '/erp/stock-movements',    icon: ArrowsRightLeftIcon,         permission: 'erp.stock.list' },
        ],
      },
      {
        label: 'Sale',
        icon: ShoppingCartIcon,
        children: [
          { label: 'Sale Items',  to: '/erp/sale-items',  icon: ListBulletIcon,            permission: 'erp.orders.list' },
          { label: 'Order Items', to: '/erp/order-items', icon: ClipboardDocumentListIcon, permission: 'order-items.list' },
          { label: 'Sales',       to: '/erp/orders',      icon: ShoppingCartIcon,          permission: 'erp.orders.list' },
          { label: 'Pricing',     to: '/erp/pricing',     icon: TagIcon,                   permission: 'erp.pricing.list' },
        ],
      },
    ],
  },
}
