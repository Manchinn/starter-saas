import { createRouter, createWebHistory } from 'vue-router'
import { getModuleRoutes, getRoutePermission } from '@/core/ModuleRegistry'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'

// Cached install status — checked once per page load, reset after install completes
let installChecked = false
let isInstalled = true

export function resetInstallCache() {
  installChecked = false
}

async function checkInstallStatus() {
  if (installChecked) return isInstalled
  try {
    const { data } = await api.get('/auth/install-status')
    isInstalled = data.data.installed
  } catch {
    isInstalled = true
  }
  installChecked = true
  return isInstalled
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: () => {
        const auth = useAuthStore()
        return auth.isAdmin ? '/dashboard' : '/erp/dashboard'
      },
    },
    ...getModuleRoutes(),
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/modules/dashboard/views/NotFound.vue'),
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  // Re-check install status when leaving the install page (after form submit)
  if (from.name === 'install') {
    installChecked = false
  }

  const installed = await checkInstallStatus()

  // If not installed, only allow the install page
  if (!installed) {
    if (to.name !== 'install') return next('/install')
    return next()
  }

  // If installed and navigating to install page, redirect away
  if (to.meta.isInstallPage) {
    if (auth.isAuthenticated) return next(auth.isAdmin ? '/dashboard' : '/erp/dashboard')
    return next('/login')
  }

  // Token exists but user not loaded (e.g. page refresh) — restore session
  if (auth.accessToken && !auth.user) {
    try {
      await auth.fetchMe()
    } catch {
      auth.clearSession()
      if (to.meta.requiresAuth !== false) return next('/login')
    }
  }

  const requiresAuth = to.meta.requiresAuth !== false
  const requiresAdmin = to.meta.requiresAdmin === true
  const isGuest = to.meta.guest === true

  const defaultHome = auth.isAdmin ? '/dashboard' : '/erp/dashboard'

  if (isGuest && auth.isAuthenticated) return next(defaultHome)
  if (requiresAuth && !auth.isAuthenticated) return next('/login')
  if (requiresAdmin && !auth.isAdmin) return next('/erp/dashboard')

  // Block direct-URL access to permissioned pages the user can't see in the nav.
  // We render the 404 page (rather than a 403) so restricted pages don't reveal
  // their existence. The attempted URL is preserved via the catch-all params.
  // Admins pass (hasPermission short-circuits); unguarded pages return null.
  if (requiresAuth && auth.isAuthenticated && to.name !== 'not-found') {
    const requiredPermission = getRoutePermission(to.path)
    if (requiredPermission && !auth.hasPermission(requiredPermission)) {
      return next({ name: 'not-found', params: { pathMatch: to.path.substring(1).split('/') } })
    }
  }

  next()
})

export default router
