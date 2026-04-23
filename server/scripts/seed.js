require('dotenv').config()
const { sequelize, User, Module, Role, Permission } = require('../models')

const DEFAULT_PERMISSIONS = [
  // Dashboard
  { name: 'View Dashboard', slug: 'dashboard.view', group: 'dashboard', description: 'Access the dashboard' },
  // Organizations
  { name: 'List Organizations', slug: 'organizations.list', group: 'organizations', description: 'View list of organizations' },
  { name: 'Edit Organizations', slug: 'organizations.edit', group: 'organizations', description: 'Edit organization details' },
  { name: 'Delete Organizations', slug: 'organizations.delete', group: 'organizations', description: 'Delete organizations' },
  // Modules
  { name: 'List Modules', slug: 'modules.list', group: 'modules', description: 'View modules' },
  { name: 'Manage Modules', slug: 'modules.manage', group: 'modules', description: 'Create/edit/toggle modules' },
  // Roles
  { name: 'List Roles', slug: 'roles.list', group: 'roles', description: 'View roles and their permissions' },
  { name: 'Manage Roles', slug: 'roles.manage', group: 'roles', description: 'Create/edit/delete roles' },
  // Permissions
  { name: 'List Permissions', slug: 'permissions.list', group: 'permissions', description: 'View permissions' },
  { name: 'Manage Permissions', slug: 'permissions.manage', group: 'permissions', description: 'Create/edit/delete permissions' },
]

const DEFAULT_ROLES = [
  {
    name: 'Super Admin',
    slug: 'super-admin',
    description: 'Full access to everything',
    color: '#7c3aed',
    isSystem: true,
    permissionSlugs: DEFAULT_PERMISSIONS.map((p) => p.slug),
  },
  {
    name: 'Manager',
    slug: 'manager',
    description: 'Can manage organizations and view modules',
    color: '#2563eb',
    isSystem: false,
    permissionSlugs: ['dashboard.view', 'organizations.list', 'organizations.edit', 'modules.list', 'roles.list', 'permissions.list'],
  },
  {
    name: 'Viewer',
    slug: 'viewer',
    description: 'Read-only access',
    color: '#16a34a',
    isSystem: false,
    permissionSlugs: ['dashboard.view', 'organizations.list', 'modules.list'],
  },
]

async function seed() {
  await sequelize.sync({ force: true })
  console.log('Database synced.\n')

  // Permissions
  const createdPerms = {}
  for (const p of DEFAULT_PERMISSIONS) {
    const perm = await Permission.create(p)
    createdPerms[p.slug] = perm
  }
  console.log(`Created ${Object.keys(createdPerms).length} permissions.`)

  // Roles
  const createdRoles = {}
  for (const r of DEFAULT_ROLES) {
    const { permissionSlugs, ...roleData } = r
    const role = await Role.create(roleData)
    const perms = permissionSlugs.map((s) => createdPerms[s]).filter(Boolean)
    await role.setPermissions(perms)
    createdRoles[r.slug] = role
  }
  console.log(`Created ${Object.keys(createdRoles).length} roles.`)

  // Admin user
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@example.com',
    password: 'Admin1234!',
    role: 'admin',
  })
  await admin.setRoles([createdRoles['super-admin']])
  console.log('Admin created:', admin.email)

  // Demo user
  const demo = await User.create({
    name: 'Demo User',
    email: 'user@example.com',
    password: 'User1234!',
    role: 'user',
  })
  await demo.setRoles([createdRoles['viewer']])
  console.log('Demo user created:', demo.email)

  // Assign all modules to admin
  const allModules = await Module.findAll()
  if (allModules.length) {
    await admin.setModules(allModules)
    console.log(`Assigned ${allModules.length} modules to admin.`)
  }

  console.log('\nSeed complete.\n')
  console.log('  Admin:     admin@example.com / Admin1234!')
  console.log('  Demo user: user@example.com  / User1234!')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
