import { BuildingOffice2Icon, PuzzlePieceIcon, ShieldCheckIcon, KeyIcon, Squares2X2Icon, SparklesIcon, UserGroupIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline'

export default {
  slug: 'admin',
  isCore: true,
  adminOnly: false,   // routes below use per-route meta instead
  order: 999,
  routes: [
    {
      path: '/admin/organizations',
      name: 'admin-organizations',
      component: () => import('./views/Organizations.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'nav.organizations' },
    },
    {
      path: '/admin/organizations/create',
      name: 'admin-organizations-create',
      component: () => import('./views/OrganizationCreate.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'org.new' },
    },
    {
      path: '/admin/organizations/:id/edit',
      name: 'admin-organizations-edit',
      component: () => import('./views/OrganizationEdit.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'org.edit' },
    },
    {
      path: '/admin/roles',
      name: 'admin-roles',
      component: () => import('./views/Roles.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'roles.title' },
    },
    {
      path: '/admin/roles/create',
      name: 'admin-roles-create',
      component: () => import('./views/RoleCreate.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'roles.newTitle' },
    },
    {
      path: '/admin/roles/:id/edit',
      name: 'admin-roles-edit',
      component: () => import('./views/RoleEdit.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'roles.editTitle' },
    },
    {
      path: '/admin/roles/:id/permissions',
      name: 'admin-role-permissions',
      component: () => import('./views/RolePermissions.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'nav.permissions' },
    },
    {
      path: '/admin/roles/:id/modules',
      name: 'admin-role-modules',
      component: () => import('./views/RoleModules.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'roles.assignModules' },
    },
    {
      path: '/admin/permissions',
      name: 'admin-permissions',
      component: () => import('./views/Permissions.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'perms.title' },
    },
    {
      path: '/admin/permissions/create',
      name: 'admin-permissions-create',
      component: () => import('./views/PermissionCreate.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'perms.newTitle' },
    },
    {
      path: '/admin/permissions/:id/edit',
      name: 'admin-permissions-edit',
      component: () => import('./views/PermissionEdit.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'perms.editTitle' },
    },
    {
      path: '/admin/modules',
      name: 'admin-modules',
      component: () => import('./views/Modules.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'mods.coreTitle' },
    },
    {
      path: '/admin/modules/:id/edit',
      name: 'admin-modules-edit',
      component: () => import('./views/ModuleEdit.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'mods.editTitle' },
    },
    {
      path: '/admin/shared-modules',
      name: 'admin-shared-modules',
      component: () => import('./views/SharedModules.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'mods.sharedTitle' },
    },
    {
      path: '/admin/shared-modules/create',
      name: 'admin-shared-modules-create',
      component: () => import('./views/SharedModuleCreate.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'mods.newShared' },
    },
    {
      path: '/admin/shared-modules/:id/edit',
      name: 'admin-shared-modules-edit',
      component: () => import('./views/SharedModuleEdit.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'mods.editShared' },
    },
    {
      path: '/admin/templates',
      name: 'admin-templates',
      component: () => import('./views/Templates.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'templates.title' },
    },
  ],
  // Visible to all users — but hidden for regular users who have no active modules assigned
  navItem: {
    label: 'nav.sharedModules',
    to: '/admin/shared-modules',
    icon: Squares2X2Icon,
    showIfHasUserModules: true,
  },

  // Admin sub-group (rendered by AppLayout only when isAdmin)
  adminNavItem: {
    label: 'nav.admin',
    icon: ShieldCheckIcon,
    children: [
      { label: 'nav.organizations', to: '/admin/organizations', icon: BuildingOffice2Icon, permission: 'organizations.list' },
      { label: 'nav.roles',         to: '/admin/roles',         icon: ShieldCheckIcon,   permission: 'roles.list' },
      { label: 'nav.permissions',   to: '/admin/permissions',   icon: KeyIcon,           permission: 'permissions.list' },
      { label: 'nav.coreModules',   to: '/admin/modules',       icon: PuzzlePieceIcon,   permission: 'modules.list' },
      { label: 'nav.templates',     to: '/admin/templates',     icon: SparklesIcon },
      { label: 'nav.settings',      to: '/admin/settings',      icon: Cog6ToothIcon },
    ],
  },
}
