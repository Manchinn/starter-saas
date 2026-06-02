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
  // Nav entry lives under the Admin group (see modules/admin adminNavItem children).
}
