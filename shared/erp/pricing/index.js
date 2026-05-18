import { TagIcon } from '@heroicons/vue/24/outline'

export const routes = [
  {
    path: '/erp/pricing',
    name: 'erp-pricing',
    component: () => import('./views/PricingList.vue'),
    meta: { requiresAuth: true, title: 'Price Lists' },
  },
  {
    path: '/erp/pricing/create',
    name: 'erp-pricing-create',
    component: () => import('./views/PricingCreate.vue'),
    meta: { requiresAuth: true, title: 'New Price List' },
  },
  {
    path: '/erp/pricing/:id/edit',
    name: 'erp-pricing-edit',
    component: () => import('./views/PricingEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Price List' },
  },
]

export const navChildren = [
  { label: 'nav.priceLists', to: '/erp/pricing', icon: TagIcon, permission: 'erp.pricing.list' },
]
