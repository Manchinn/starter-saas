import { BuildingLibraryIcon } from '@heroicons/vue/24/outline'

export const routes = [
  {
    path: '/erp/vendors',
    name: 'erp-vendors',
    component: () => import('./views/VendorsList.vue'),
    meta: { requiresAuth: true, title: 'Vendors' },
  },
  {
    path: '/erp/vendors/create',
    name: 'erp-vendors-create',
    component: () => import('./views/VendorCreate.vue'),
    meta: { requiresAuth: true, title: 'New Vendor' },
  },
  {
    path: '/erp/vendors/:id/edit',
    name: 'erp-vendors-edit',
    component: () => import('./views/VendorEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Vendor' },
  },
]

export const navChildren = [
  { label: 'nav.vendors', to: '/erp/vendors', icon: BuildingLibraryIcon, permission: 'erp.products.list' },
]
