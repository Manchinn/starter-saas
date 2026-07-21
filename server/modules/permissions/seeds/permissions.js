// Core permission catalog. Idempotent — created once, matched by slug.
const DEFAULT_PERMISSIONS = [
  { name: 'View Dashboard', slug: 'dashboard.view', group: 'dashboard', description: 'Access the dashboard' },
  { name: 'List Organizations', slug: 'organizations.list', group: 'organizations', description: 'View list of organizations' },
  { name: 'Edit Organizations', slug: 'organizations.edit', group: 'organizations', description: 'Edit organization details' },
  { name: 'Delete Organizations', slug: 'organizations.delete', group: 'organizations', description: 'Delete organizations' },
  { name: 'List Modules', slug: 'modules.list', group: 'modules', description: 'View modules' },
  { name: 'Manage Modules', slug: 'modules.manage', group: 'modules', description: 'Create/edit/toggle modules' },
  { name: 'List Roles', slug: 'roles.list', group: 'roles', description: 'View roles and their permissions' },
  { name: 'Manage Roles', slug: 'roles.manage', group: 'roles', description: 'Create/edit/delete roles' },
  { name: 'List Permissions', slug: 'permissions.list', group: 'permissions', description: 'View permissions' },
  { name: 'Manage Permissions', slug: 'permissions.manage', group: 'permissions', description: 'Create/edit/delete permissions' },
  { name: 'Manage LINE Integration', slug: 'erp.line-integration.manage', group: 'erp', description: 'Configure LINE LIFF and Messaging API' },
]

const moduleLoader = require('../../../core/module.loader')

module.exports = {
  name: 'permissions',
  tier: 'core',
  order: 10,
  async run(ctx) {
    const { Permission } = ctx.models
    // Core admin permissions + every permission declared by the shared modules
    // (erp.*, hrms.*, reporting.*, ai-agent.*) so they are grantable to roles
    // from /admin/roles and surface in /admin/permissions.
    const catalog = [
      ...DEFAULT_PERMISSIONS,
      ...moduleLoader.sharedModulePermissionSlugs().map(moduleLoader.describePermissionSlug),
    ]
    const bySlug = {}
    for (const p of catalog) {
      const [perm] = await Permission.findOrCreate({ where: { slug: p.slug }, defaults: p })
      bySlug[p.slug] = perm
    }
    ctx.set('permissions', bySlug)
  },
}

module.exports.DEFAULT_PERMISSIONS = DEFAULT_PERMISSIONS
