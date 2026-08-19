import { ShoppingBagIcon } from '@heroicons/vue/24/outline'

export default {
  slug: 'line',
  order: 93,
  routes: [
    {
      path: '/line-liff',
      name: 'line-liff',
      component: () => import('./views/LiffOrdering.vue'),
      meta: { requiresAuth: false, title: 'line.liffTitle' },
    },
  ],
}