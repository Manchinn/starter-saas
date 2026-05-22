import {
  TruckIcon,
  AdjustmentsHorizontalIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  ReceiptRefundIcon,
  ChartBarIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/vue/24/outline'

export const routes = [
  // Goods Receive
  {
    path: '/erp/good-receive',
    name: 'erp-good-receive',
    component: () => import('./good-receive/views/GoodReceiveList.vue'),
    meta: { requiresAuth: true, title: 'Goods Receive' },
  },
  {
    path: '/erp/good-receive/create',
    name: 'erp-good-receive-create',
    component: () => import('./good-receive/views/GoodReceiveCreate.vue'),
    meta: { requiresAuth: true, title: 'New Goods Receive' },
  },
  {
    path: '/erp/good-receive/:id',
    name: 'erp-good-receive-detail',
    component: () => import('./good-receive/views/GoodReceiveDetail.vue'),
    meta: { requiresAuth: true, title: 'Goods Receive Detail' },
  },
  {
    path: '/erp/good-receive/:id/edit',
    name: 'erp-good-receive-edit',
    component: () => import('./good-receive/views/GoodReceiveEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Goods Receive' },
  },
  // Stock Adjust
  {
    path: '/erp/stock-adjust',
    name: 'erp-stock-adjust',
    component: () => import('./stock-adjust/views/StockAdjustList.vue'),
    meta: { requiresAuth: true, title: 'Stock Adjustment' },
  },
  {
    path: '/erp/stock-adjust/create',
    name: 'erp-stock-adjust-create',
    component: () => import('./stock-adjust/views/StockAdjustCreate.vue'),
    meta: { requiresAuth: true, title: 'New Stock Adjustment' },
  },
  {
    path: '/erp/stock-adjust/:id',
    name: 'erp-stock-adjust-detail',
    component: () => import('./stock-adjust/views/StockAdjustDetail.vue'),
    meta: { requiresAuth: true, title: 'Stock Adjustment Detail' },
  },
  {
    path: '/erp/stock-adjust/:id/edit',
    name: 'erp-stock-adjust-edit',
    component: () => import('./stock-adjust/views/StockAdjustEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Stock Adjustment' },
  },
  // Stock Balance
  {
    path: '/erp/stock-balance',
    name: 'erp-stock-balance',
    component: () => import('./stock-balance/views/StockBalanceList.vue'),
    meta: { requiresAuth: true, title: 'Stock Balance' },
  },
  {
    path: '/erp/stock-balance/product/:productId',
    name: 'erp-stock-balance-product',
    component: () => import('./stock-balance/views/StockBalanceProduct.vue'),
    meta: { requiresAuth: true, title: 'Stock Balance — Product Overview' },
  },
  // Stock Movements
  {
    path: '/erp/stock-movements',
    name: 'erp-stock-movements',
    component: () => import('./stock-movement/views/StockMovementList.vue'),
    meta: { requiresAuth: true, title: 'Stock Movements' },
  },
  // Stock Count
  {
    path: '/erp/stock-count',
    name: 'erp-stock-count',
    component: () => import('./stock-count/views/StockCountList.vue'),
    meta: { requiresAuth: true, title: 'Stock Count' },
  },
  {
    path: '/erp/stock-count/create',
    name: 'erp-stock-count-create',
    component: () => import('./stock-count/views/StockCountCreate.vue'),
    meta: { requiresAuth: true, title: 'New Stock Count' },
  },
  {
    path: '/erp/stock-count/:id',
    name: 'erp-stock-count-detail',
    component: () => import('./stock-count/views/StockCountDetail.vue'),
    meta: { requiresAuth: true, title: 'Stock Count Detail' },
  },
  {
    path: '/erp/stock-count/:id/edit',
    name: 'erp-stock-count-edit',
    component: () => import('./stock-count/views/StockCountEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Stock Count' },
  },
  // Stock Transfer
  {
    path: '/erp/stock-request',
    name: 'erp-stock-request',
    component: () => import('./stock-request/views/StockRequestList.vue'),
    meta: { requiresAuth: true, title: 'Stock Transfer' },
  },
  {
    path: '/erp/stock-request/create',
    name: 'erp-stock-request-create',
    component: () => import('./stock-request/views/StockRequestCreate.vue'),
    meta: { requiresAuth: true, title: 'New Stock Transfer' },
  },
  {
    path: '/erp/stock-request/:id',
    name: 'erp-stock-request-detail',
    component: () => import('./stock-request/views/StockRequestDetail.vue'),
    meta: { requiresAuth: true, title: 'Stock Transfer Detail' },
  },
  {
    path: '/erp/stock-request/:id/edit',
    name: 'erp-stock-request-edit',
    component: () => import('./stock-request/views/StockRequestEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Stock Transfer' },
  },
  // Stock Return
  {
    path: '/erp/stock-return',
    name: 'erp-stock-return',
    component: () => import('./stock-return/views/StockReturnList.vue'),
    meta: { requiresAuth: true, title: 'Stock Return' },
  },
  {
    path: '/erp/stock-return/create',
    name: 'erp-stock-return-create',
    component: () => import('./stock-return/views/StockReturnCreate.vue'),
    meta: { requiresAuth: true, title: 'New Stock Return' },
  },
  {
    path: '/erp/stock-return/:id',
    name: 'erp-stock-return-detail',
    component: () => import('./stock-return/views/StockReturnDetail.vue'),
    meta: { requiresAuth: true, title: 'Stock Return Detail' },
  },
  {
    path: '/erp/stock-return/:id/edit',
    name: 'erp-stock-return-edit',
    component: () => import('./stock-return/views/StockReturnEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Stock Return' },
  },
  // Stock Issue
  {
    path: '/erp/stock-issue',
    name: 'erp-stock-issue',
    component: () => import('./stock-issue/views/StockIssueList.vue'),
    meta: { requiresAuth: true, title: 'Stock Issues' },
  },
  {
    path: '/erp/stock-issue/create',
    name: 'erp-stock-issue-create',
    component: () => import('./stock-issue/views/StockIssueCreate.vue'),
    meta: { requiresAuth: true, title: 'New Stock Issue' },
  },
  {
    path: '/erp/stock-issue/:id',
    name: 'erp-stock-issue-detail',
    component: () => import('./stock-issue/views/StockIssueDetail.vue'),
    meta: { requiresAuth: true, title: 'Stock Issue Detail' },
  },
  {
    path: '/erp/stock-issue/:id/edit',
    name: 'erp-stock-issue-edit',
    component: () => import('./stock-issue/views/StockIssueEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Stock Issue' },
  },
]

// Nav items that belong to the Inventory nav group
export const inventoryNavChildren = [
  { label: 'nav.stockAdjustment', to: '/erp/stock-adjust',    icon: AdjustmentsHorizontalIcon,  permission: 'erp.stock.list' },
  { label: 'nav.stockCount',      to: '/erp/stock-count',     icon: ClipboardDocumentCheckIcon, permission: 'erp.stock.list' },
  { label: 'nav.stockTransfer',   to: '/erp/stock-request',   icon: ArrowPathIcon,              permission: 'erp.stock.list' },
  { label: 'nav.stockReturn',     to: '/erp/stock-return',    icon: ReceiptRefundIcon,          permission: 'erp.stock.list' },
  { label: 'nav.stockIssue',      to: '/erp/stock-issue',     icon: ArrowPathIcon,              permission: 'erp.stock.list' },
  { label: 'nav.stockBalance',    to: '/erp/stock-balance',   icon: ChartBarIcon,               permission: 'erp.stock.list' },
  { label: 'nav.stockMovement',   to: '/erp/stock-movements', icon: ArrowsRightLeftIcon,        permission: 'erp.stock.list' },
]

// Nav item that belongs to the Purchasing nav group
export const goodReceiveNavItem = {
  label: 'nav.goodsReceive',
  to: '/erp/good-receive',
  icon: TruckIcon,
  permission: 'erp.stock.list',
}
