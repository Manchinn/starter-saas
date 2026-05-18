import { ArchiveBoxIcon, ClipboardDocumentListIcon } from '@heroicons/vue/24/outline'

export const routes = [
  {
    path: '/erp/sale-packages',
    name: 'erp-sale-packages',
    component: () => import('./views/sale-packages/SalePackagesList.vue'),
    meta: { requiresAuth: true, title: 'Sale Packages' },
  },
  {
    path: '/erp/sale-packages/create',
    name: 'erp-sale-packages-create',
    component: () => import('./views/sale-packages/SalePackageCreate.vue'),
    meta: { requiresAuth: true, title: 'New Sale Package' },
  },
  {
    path: '/erp/sale-packages/:id/edit',
    name: 'erp-sale-packages-edit',
    component: () => import('./views/sale-packages/SalePackageEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Sale Package' },
  },
  {
    path: '/erp/sale-items',
    name: 'erp-sale-items',
    component: () => import('./views/sale-items/SaleItemsList.vue'),
    meta: { requiresAuth: true, title: 'Sale Items' },
  },
  {
    path: '/erp/sale-items/create',
    name: 'erp-sale-items-create',
    component: () => import('./views/sale-items/SaleItemCreate.vue'),
    meta: { requiresAuth: true, title: 'New Sale Item' },
  },
  {
    path: '/erp/sale-items/:id/edit',
    name: 'erp-sale-items-edit',
    component: () => import('./views/sale-items/SaleItemEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Sale Item' },
  },
]

export const navChildren = [
  { label: 'nav.salePackages', to: '/erp/sale-packages', icon: ArchiveBoxIcon,            permission: 'erp.sale-packages.list' },
  { label: 'nav.saleItems',    to: '/erp/sale-items',    icon: ClipboardDocumentListIcon, permission: 'erp.sale-items.list' },
]
