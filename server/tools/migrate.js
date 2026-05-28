#!/usr/bin/env node
/**
 * Migration CLI.
 *
 *   node tools/migrate.js up               apply all pending migrations
 *   node tools/migrate.js up <name>        apply one migration (exact or unique substring)
 *   node tools/migrate.js down [n]         roll back the last n (default 1)
 *   node tools/migrate.js down <name>      roll back one specific migration
 *   node tools/migrate.js status           list every migration + applied state
 *
 * Run from the server workspace, e.g. `npm run migrate:down -- 2` or
 * `npm run migrate -- orders_header`.
 */
require('dotenv').config()
const { sequelize } = require('../models')
const migrator = require('../core/migrator')
const log = require('../core/logger').forLabel('migrate-cli')

async function main() {
  const [cmd, arg] = process.argv.slice(2)
  await sequelize.authenticate()

  switch (cmd) {
    case 'up':
      await migrator.up(sequelize, arg ? { only: arg } : {})
      break
    case 'down':
      if (!arg) await migrator.down(sequelize, { steps: 1 })
      else if (/^\d+$/.test(arg)) await migrator.down(sequelize, { steps: parseInt(arg, 10) })
      else await migrator.down(sequelize, { name: arg })
      break
    case 'status': {
      const rows = await migrator.status(sequelize)
      const applied = rows.filter((r) => r.applied).length
      for (const r of rows) console.log(`${r.applied ? '[x]' : '[ ]'} ${r.name}`)
      console.log(`\n${applied}/${rows.length} applied, ${rows.length - applied} pending`)
      break
    }
    default:
      console.log('Usage: migrate.js <up [name] | down [n|name] | status>')
      process.exitCode = 1
  }
}

main()
  .catch((err) => { log.error('Migration CLI failed', { error: err.message, stack: err.stack }); process.exitCode = 1 })
  .finally(() => sequelize.close())
