import { ReceiptRefundIcon } from '@heroicons/vue/24/outline'

export const routes = [
  {
    path: '/erp/receipts',
    name: 'erp-receipts',
    component: () => import('./views/ReceiptsList.vue'),
    meta: { requiresAuth: true, title: 'Receipts' },
  },
  {
    path: '/erp/receipts/create',
    name: 'erp-receipts-create',
    component: () => import('./views/ReceiptCreate.vue'),
    meta: { requiresAuth: true, title: 'New Receipt' },
  },
  {
    path: '/erp/receipts/:id',
    name: 'erp-receipts-detail',
    component: () => import('./views/ReceiptDetail.vue'),
    meta: { requiresAuth: true, title: 'Receipt Detail' },
  },
]

export const navChildren = [
  { label: 'nav.receipts', to: '/erp/receipts', icon: ReceiptRefundIcon, permission: 'erp.receipts.list' },
]
