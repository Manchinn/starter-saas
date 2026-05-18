import { BuildingStorefrontIcon, ScaleIcon, ArrowUturnRightIcon } from '@heroicons/vue/24/outline'

export const routes = [
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
  {
    path: '/erp/uom-conversion',
    name: 'erp-uom-conversion',
    component: () => import('./views/uom-conversion/UOMConversionList.vue'),
    meta: { requiresAuth: true, title: 'UOM Conversion' },
  },
  {
    path: '/erp/uom-conversion/create',
    name: 'erp-uom-conversion-create',
    component: () => import('./views/uom-conversion/UOMConversionCreate.vue'),
    meta: { requiresAuth: true, title: 'New UOM Conversion' },
  },
  {
    path: '/erp/uom-conversion/:id/edit',
    name: 'erp-uom-conversion-edit',
    component: () => import('./views/uom-conversion/UOMConversionEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit UOM Conversion' },
  },
]

export const navChildren = [
  { label: 'nav.stores',        to: '/erp/stores',          icon: BuildingStorefrontIcon, permission: 'erp.stores.list' },
  { label: 'nav.uom',           to: '/erp/uom',             icon: ScaleIcon,              permission: 'erp.uom.list' },
  { label: 'nav.uomConversion', to: '/erp/uom-conversion',  icon: ArrowUturnRightIcon,    permission: 'erp.uom.list' },
]
