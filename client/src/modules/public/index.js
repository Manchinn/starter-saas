export default {
  slug: 'public',
  isCore: true,
  order: -10,
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('./views/Landing.vue'),
      meta: { requiresAuth: false, guest: true, title: 'Home' },
    },
  ],
}
