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
  { name: 'Manage Billing', slug: 'billing.manage', group: 'billing', description: 'Manage plans and organization subscriptions' },
]

module.exports = {
  name: 'permissions',
  tier: 'core',
  order: 10,
  async run(ctx) {
    const { Permission } = ctx.models
    const bySlug = {}
    for (const p of DEFAULT_PERMISSIONS) {
      const [perm] = await Permission.findOrCreate({ where: { slug: p.slug }, defaults: p })
      bySlug[p.slug] = perm
    }
    ctx.set('permissions', bySlug)
  },
}

module.exports.DEFAULT_PERMISSIONS = DEFAULT_PERMISSIONS
