import { Cog6ToothIcon } from '@heroicons/vue/24/outline'

export default {
  slug: 'settings',
  isCore: true,
  order: 95,
  routes: [
    {
      path: '/admin/settings',
      name: 'admin-settings',
      component: () => import('./views/Settings.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'settings.title' },
    },
  ],
  // Admin-only entry, rendered in the Core section by the nav registry.
  adminNavItem: {
    label: 'nav.settings',
    to: '/admin/settings',
    icon: Cog6ToothIcon,
  },
}
