import { UsersIcon, PuzzlePieceIcon, ShieldCheckIcon, KeyIcon, Squares2X2Icon, SparklesIcon } from '@heroicons/vue/24/outline'

export default {
  slug: 'admin',
  isCore: true,
  adminOnly: false,   // routes below use per-route meta instead
  order: 90,
  routes: [
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('./views/Users.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'Users' },
    },
    {
      path: '/admin/roles',
      name: 'admin-roles',
      component: () => import('./views/Roles.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'Roles' },
    },
    {
      path: '/admin/roles/:id/permissions',
      name: 'admin-role-permissions',
      component: () => import('./views/RolePermissions.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'Role Permissions' },
    },
    {
      path: '/admin/permissions',
      name: 'admin-permissions',
      component: () => import('./views/Permissions.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'Permissions' },
    },
    {
      path: '/admin/modules',
      name: 'admin-modules',
      component: () => import('./views/Modules.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'Core Modules' },
    },
    {
      path: '/admin/shared-modules',
      name: 'admin-shared-modules',
      component: () => import('./views/SharedModules.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'Shared Modules' },
    },
    {
      path: '/admin/templates',
      name: 'admin-templates',
      component: () => import('./views/Templates.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'Templates' },
    },
  ],
  // Visible to all users — but hidden for regular users who have no active modules assigned
  navItem: {
    label: 'Shared Modules',
    to: '/admin/shared-modules',
    icon: Squares2X2Icon,
    showIfHasUserModules: true,
  },

  // Admin sub-group (rendered by AppLayout only when isAdmin)
  adminNavItem: {
    label: 'Admin',
    icon: ShieldCheckIcon,
    children: [
      { label: 'Users',        to: '/admin/users',       icon: UsersIcon,       permission: 'users.list' },
      { label: 'Roles',        to: '/admin/roles',       icon: ShieldCheckIcon, permission: 'roles.list' },
      { label: 'Permissions',  to: '/admin/permissions', icon: KeyIcon,         permission: 'permissions.list' },
      { label: 'Core Modules', to: '/admin/modules',     icon: PuzzlePieceIcon, permission: 'modules.list' },
      { label: 'Templates',    to: '/admin/templates',   icon: SparklesIcon },
    ],
  },
}
