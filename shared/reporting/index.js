import { ChartPieIcon, PresentationChartLineIcon } from '@heroicons/vue/24/outline'

export const routes = [
  {
    path: '/reporting/erp-summary',
    name: 'reporting-erp-summary',
    component: () => import('./summary/views/ERPSummary.vue'),
    meta: { requiresAuth: true, title: 'ERP Summary' },
  },
]

export default {
  slug: 'reporting',
  isCore: false,
  order: 40,
  routes,
  navItem: {
    label: 'nav.reporting',
    icon: ChartPieIcon,
    children: [
      { label: 'nav.erpSummary', to: '/reporting/erp-summary', icon: PresentationChartLineIcon, permission: 'erp.products.list' },
    ],
  },
}
