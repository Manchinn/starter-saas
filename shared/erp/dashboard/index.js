import { HomeIcon } from '@heroicons/vue/24/outline'

export const routes = [
  {
    path: '/erp/dashboard',
    name: 'erp-dashboard',
    component: () => import('./views/ERPDashboard.vue'),
    meta: { requiresAuth: true, title: 'ERP Dashboard' },
  },
]

export const navChildren = [
  { label: 'nav.erpDashboard', to: '/erp/dashboard', icon: HomeIcon },
]
