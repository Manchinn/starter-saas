import { UserCircleIcon } from '@heroicons/vue/24/outline'

export default {
  slug: 'profile',
  isCore: true,
  order: 95,
  routes: [
    {
      path: '/profile',
      redirect: '/profile/general',
    },
    {
      path: '/profile/general',
      name: 'profile-general',
      component: () => import('./views/ProfileGeneral.vue'),
      meta: { requiresAuth: true, title: 'profile.title' },
    },
    {
      path: '/profile/password',
      name: 'profile-password',
      component: () => import('./views/ProfilePassword.vue'),
      meta: { requiresAuth: true, title: 'profile.passwordTitle' },
    },
    {
      path: '/profile/sessions',
      name: 'profile-sessions',
      component: () => import('./views/ProfileSessions.vue'),
      meta: { requiresAuth: true, title: 'profile.sessionsTitle' },
    },
  ],
  // Intentionally no sidebar navItem — entry point is the topbar user menu.
}
