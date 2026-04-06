import {
  LockClosedIcon,
} from '@heroicons/vue/24/outline'

export default {
  slug: 'auth',
  isCore: true,
  order: 0,
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('./views/Login.vue'),
      meta: { requiresAuth: false, guest: true, title: 'Login' },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('./views/Register.vue'),
      meta: { requiresAuth: false, guest: true, title: 'Register' },
    },
    {
      path: '/install',
      name: 'install',
      component: () => import('./views/Install.vue'),
      meta: { requiresAuth: false, isInstallPage: true, title: 'Setup' },
    },
  ],
  // No navItem — auth routes don't appear in sidebar
}
