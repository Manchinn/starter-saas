import { ChartPieIcon, PresentationChartLineIcon, Squares2X2Icon } from '@heroicons/vue/24/outline'

export const routes = [
  {
    path: '/reporting/erp-summary',
    name: 'reporting-erp-summary',
    component: () => import('./summary/views/ERPSummary.vue'),
    meta: { requiresAuth: true, title: 'nav.reportingOverview' },
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
      {
        label: 'nav.reportingDashboard',
        icon: Squares2X2Icon,
        children: [
          { label: 'nav.reportingOverview', to: '/reporting/erp-summary', icon: PresentationChartLineIcon, permission: 'erp.products.list' },
        ],
      },
    ],
  },
}
