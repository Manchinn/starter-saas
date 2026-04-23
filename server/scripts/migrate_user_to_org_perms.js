require('dotenv').config()
const { sequelize, Permission } = require('../models')

async function migrate() {
  try {
    await sequelize.authenticate()
    console.log('[Migration] Database connected.')

    const mapping = [
      { from: 'users.list', to: 'organizations.list', name: 'List Organizations', group: 'organizations' },
      { from: 'users.edit', to: 'organizations.edit', name: 'Edit Organizations', group: 'organizations' },
      { from: 'users.delete', to: 'organizations.delete', name: 'Delete Organizations', group: 'organizations' },
    ]

    for (const m of mapping) {
      console.log(`[Migration] Checking permission: ${m.from}`)
      const perm = await Permission.findOne({ where: { slug: m.from } })
      if (perm) {
        console.log(`[Migration] Updating ${m.from} -> ${m.to}`)
        await perm.update({
          slug: m.to,
          name: m.name,
          group: m.group
        })
      } else {
        console.log(`[Migration] Permission ${m.from} not found (already migrated or never existed).`)
      }
    }

    console.log('[Migration] Success.')
    process.exit(0)
  } catch (err) {
    console.error('[Migration] Failed:', err)
    process.exit(1)
  }
}

migrate().catch(err => {
  console.error(err)
  process.exit(1)
})
