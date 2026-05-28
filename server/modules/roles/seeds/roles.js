// Default roles + their permission grants. Reads the permission map seeded by
// the permissions seed (order 10) from the shared context.
const { DEFAULT_PERMISSIONS } = require('../../permissions/seeds/permissions')

const DEFAULT_ROLES = [
  {
    name: 'Super Admin', slug: 'super-admin', description: 'Full access to everything',
    color: '#7c3aed', isSystem: true,
    permissionSlugs: DEFAULT_PERMISSIONS.map((p) => p.slug),
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
]

module.exports = {
  name: 'roles',
  tier: 'core',
  order: 20,
  async run(ctx) {
    const { Role } = ctx.models
    const permissions = ctx.get('permissions') || {}
    const bySlug = {}
    for (const r of DEFAULT_ROLES) {
      const { permissionSlugs, ...roleData } = r
      const [role] = await Role.findOrCreate({ where: { slug: r.slug }, defaults: roleData })
      await role.setPermissions(permissionSlugs.map((s) => permissions[s]).filter(Boolean))
      bySlug[r.slug] = role
    }
    ctx.set('roles', bySlug)
  },
}
