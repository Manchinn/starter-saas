// Default roles + their permission grants. Reads the permission map seeded by
// the permissions seed (order 10) from the shared context.
const moduleLoader = require('../../../core/module.loader')

// Sentinels resolved in run() against the live permission catalog:
//   '*'      → every seeded permission (core + shared modules)
//   'shared' → dashboard.view + every shared (non-core) module permission
const DEFAULT_ROLES = [
  {
    name: 'Super Admin', slug: 'super-admin', description: 'Full access to everything',
    color: '#7c3aed', isSystem: true,
    permissionSlugs: '*',
  },
  {
    name: 'Manager', slug: 'manager', description: 'Can manage organizations and view modules',
    color: '#2563eb', isSystem: false,
    permissionSlugs: ['dashboard.view', 'organizations.list', 'organizations.edit', 'modules.list', 'roles.list', 'permissions.list'],
  },
  {
    name: 'Viewer', slug: 'viewer', description: 'Read-only access',
    color: '#16a34a', isSystem: false,
    permissionSlugs: ['dashboard.view', 'organizations.list', 'modules.list'],
  },
  {
    name: 'Customer', slug: 'customer', description: 'Full access to the shared modules only — no admin access',
    color: '#0891b2', isSystem: false,
    permissionSlugs: 'shared',
  },
]

module.exports = {
  name: 'roles',
  tier: 'core',
  order: 20,
  async run(ctx) {
    const { Role, Module } = ctx.models
    const permissions = ctx.get('permissions') || {}
    const sharedSlugs = ['dashboard.view', ...moduleLoader.sharedModulePermissionSlugs()]
    const bySlug = {}
    for (const r of DEFAULT_ROLES) {
      const { permissionSlugs, ...roleData } = r
      const [role] = await Role.findOrCreate({ where: { slug: r.slug }, defaults: roleData })
      const slugs = permissionSlugs === '*' ? Object.keys(permissions)
        : permissionSlugs === 'shared' ? sharedSlugs
          : permissionSlugs
      await role.setPermissions(slugs.map((s) => permissions[s]).filter(Boolean))
      // The Customer role is explicitly scoped to the shared (non-core) modules.
      if (r.slug === 'customer') {
        await role.setModules(await Module.findAll({ where: { isCore: false } }))
      }
      bySlug[r.slug] = role
    }
    ctx.set('roles', bySlug)
  },
}
