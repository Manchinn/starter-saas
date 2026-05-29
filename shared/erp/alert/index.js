import { BellAlertIcon } from '@heroicons/vue/24/outline'

export const routes = [
  {
    path: '/erp/alerts',
    name: 'erp-alerts',
    component: () => import('./views/AlertsList.vue'),
    meta: { requiresAuth: true, title: 'Alerts' },
  },
  {
    path: '/erp/alerts/create',
    name: 'erp-alerts-create',
    component: () => import('./views/AlertCreate.vue'),
    meta: { requiresAuth: true, title: 'New Alert' },
  },
  {
    path: '/erp/alerts/:id/edit',
    name: 'erp-alerts-edit',
    component: () => import('./views/AlertEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Alert' },
  },
]

export const navChildren = [
  { label: 'nav.alerts', to: '/erp/alerts', icon: BellAlertIcon, permission: 'erp.alerts.list' },
]
