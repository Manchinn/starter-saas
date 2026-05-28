// Demo admin + viewer accounts. The admin's id doubles as the organization
// scope (orgId) for all ERP demo data, so it is published to the context.
module.exports = {
  name: 'users',
  tier: 'demo',
  order: 100,
  async run(ctx) {
    const { User, Module } = ctx.models
    const roles = ctx.get('roles') || {}

    const [admin] = await User.findOrCreate({
      where: { email: 'admin@example.com' },
      defaults: { name: 'Admin', password: 'Admin1234!', role: 'admin' },
    })
    if (roles['super-admin']) await admin.setRoles([roles['super-admin']])

    const [demo] = await User.findOrCreate({
      where: { email: 'user@example.com' },
      defaults: { name: 'Demo User', password: 'User1234!', role: 'user' },
    })
    if (roles['viewer']) await demo.setRoles([roles['viewer']])

    // Modules are registered at app boot, not by sync; assign whatever exists.
    const allModules = await Module.findAll()
    if (allModules.length) await admin.setModules(allModules)

    ctx.set('adminId', admin.id)
    ctx.set('orgId', admin.id) // admin user id acts as the org scope
    ctx.set('demoUserId', demo.id)
  },
}
