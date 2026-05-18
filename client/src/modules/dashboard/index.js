import { ChartBarIcon } from '@heroicons/vue/24/outline'

export default {
  slug: 'dashboard',
  isCore: true,
  order: 1,
  routes: [
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('./views/Dashboard.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'nav.dashboard' },
    },
  ],
  navItem: {
    label: 'nav.dashboard',
    to: '/dashboard',
    icon: ChartBarIcon,
  },
}
