import { ClipboardDocumentListIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'

export const routes = [
  {
    path: '/erp/purchasing/orders',
    name: 'erp-purchasing-orders',
    component: () => import('./views/purchase-order/PurchaseOrderList.vue'),
    meta: { requiresAuth: true, title: 'Purchase Orders' },
  },
  {
    path: '/erp/purchasing/orders/create',
    name: 'erp-purchasing-orders-create',
    component: () => import('./views/purchase-order/PurchaseOrderCreate.vue'),
    meta: { requiresAuth: true, title: 'New Purchase Order' },
  },
  {
    path: '/erp/purchasing/orders/:id',
    name: 'erp-purchasing-orders-detail',
    component: () => import('./views/purchase-order/PurchaseOrderDetail.vue'),
    meta: { requiresAuth: true, title: 'Purchase Order Detail' },
  },
  {
    path: '/erp/purchasing/orders/:id/edit',
    name: 'erp-purchasing-orders-edit',
    component: () => import('./views/purchase-order/PurchaseOrderEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Purchase Order' },
  },
  {
    path: '/erp/purchasing/requisitions',
    name: 'erp-purchasing-requisitions',
    component: () => import('./views/purchase-requisition/PurchaseRequisitionList.vue'),
    meta: { requiresAuth: true, title: 'Purchase Requisitions' },
  },
  {
    path: '/erp/purchasing/requisitions/create',
    name: 'erp-purchasing-requisitions-create',
    component: () => import('./views/purchase-requisition/PurchaseRequisitionCreate.vue'),
    meta: { requiresAuth: true, title: 'New Purchase Requisition' },
  },
  {
    path: '/erp/purchasing/requisitions/:id',
    name: 'erp-purchasing-requisitions-detail',
    component: () => import('./views/purchase-requisition/PurchaseRequisitionDetail.vue'),
    meta: { requiresAuth: true, title: 'Purchase Requisition Detail' },
  },
  {
    path: '/erp/purchasing/requisitions/:id/edit',
    name: 'erp-purchasing-requisitions-edit',
    component: () => import('./views/purchase-requisition/PurchaseRequisitionEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Purchase Requisition' },
  },
]

export const navChildren = [
  { label: 'nav.requisitions',   to: '/erp/purchasing/requisitions', icon: ClipboardDocumentListIcon, permission: 'erp.purchasing.list' },
  { label: 'nav.purchaseOrders', to: '/erp/purchasing/orders',       icon: DocumentTextIcon,          permission: 'erp.purchasing.list' },
]
