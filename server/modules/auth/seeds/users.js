// Demo admin + viewer accounts with a realistic organization profile.
// The admin's id doubles as the organization scope (orgId) for all ERP demo
// data, so it is published to the context.
//
// Fill policy (idempotent re-runs):
//   - findOrCreate defaults give fresh installs the full org profile.
//   - Re-runs never overwrite data the user has already filled in: profile
//     fields are written only when still empty, and account names are replaced
//     only when they still hold the original seed placeholder.

const ADMIN_PLACEHOLDER_NAME = 'Admin'
const DEMO_PLACEHOLDER_NAME = 'Demo User'

// Org profile printed on customer-facing documents (invoices, sales orders).
const ORG_PROFILE = {
  name: 'สมหญิง ใจดี',
  companyName: 'บริษัท แม่กะเด คอมเมิร์ซ จำกัด',
  address: '99/1 ซอยจารุเมือง ถนนเจริญกรุง แขวงบางรัก เขตบางรัก กรุงเทพมหานคร 10500',
  phone: '02-105-8123',
  taxId: '0105561059147',
  website: 'https://maekade.co.th',
}

const DEMO_USER_NAME = 'ปกรณ์ วิไลรัตน์'

function isEmpty(value) {
  return value === null || value === undefined || String(value).trim() === ''
}

// Fill empty org-profile fields on an existing account; save only if changed.
async function fillOrgProfile(user) {
  for (const [field, value] of Object.entries(ORG_PROFILE)) {
    if (field === 'name') continue // handled via placeholder replacement
    if (isEmpty(user[field])) user[field] = value
  }
  if (user.changed()) await user.save()
}

module.exports = {
  name: 'users',
  tier: 'demo',
  order: 100,
  async run(ctx) {
    const { User, Module } = ctx.models
    const roles = ctx.get('roles') || {}

    const [admin] = await User.findOrCreate({
      where: { email: 'admin@example.com' },
      defaults: { ...ORG_PROFILE, password: 'Admin1234!', role: 'admin' },
    })
    if (admin.name === ADMIN_PLACEHOLDER_NAME) admin.name = ORG_PROFILE.name
    await fillOrgProfile(admin)
    if (roles['super-admin']) await admin.setRoles([roles['super-admin']])

    const [demo] = await User.findOrCreate({
      where: { email: 'user@example.com' },
      defaults: { name: DEMO_USER_NAME, password: 'User1234!', role: 'user' },
    })
    if (demo.name === DEMO_PLACEHOLDER_NAME) demo.name = DEMO_USER_NAME
    if (demo.changed()) await demo.save()
    if (roles['viewer']) await demo.setRoles([roles['viewer']])

    // Modules are registered at app boot, not by sync; assign whatever exists.
    const allModules = await Module.findAll()
    if (allModules.length) await admin.setModules(allModules)

    ctx.set('adminId', admin.id)
    ctx.set('orgId', admin.id) // admin user id acts as the org scope
    ctx.set('demoUserId', demo.id)
  },
}
