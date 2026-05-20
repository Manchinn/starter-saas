// Adds organization-profile columns to Users so the top-level org can carry
// company info (name, address, phone, tax ID, website, logo) for documents.
// Run from any cwd — relative paths in config.db.storage are resolved against
// the server directory (this file's grandparent).
const path = require('path')
process.chdir(path.resolve(__dirname, '..'))
require('dotenv').config()
const { sequelize } = require('../models')

async function migrate() {
  try {
    await sequelize.authenticate()
    console.log('[Migration] Database connected.')

    const qi = sequelize.getQueryInterface()
    const S  = sequelize.Sequelize

    const tableNames = await qi.showAllTables()
    const tableName  = tableNames.find(t => /^users$/i.test(t)) || 'Users'
    const have       = await qi.describeTable(tableName)

    const columns = [
      ['companyName', { type: S.STRING,     allowNull: true }],
      ['address',     { type: S.TEXT,       allowNull: true }],
      ['phone',       { type: S.STRING(50), allowNull: true }],
      ['taxId',       { type: S.STRING(50), allowNull: true }],
      ['website',     { type: S.STRING,     allowNull: true }],
      ['logoPath',    { type: S.STRING,     allowNull: true }],
    ]

    for (const [name, def] of columns) {
      if (!have[name]) {
        await qi.addColumn(tableName, name, def)
        console.log(`[Migration] Added ${tableName}.${name}.`)
      }
    }

    console.log('[Migration] Success.')
    process.exit(0)
  } catch (err) {
    console.error('[Migration] Failed:', err)
    process.exit(1)
  }
}

migrate()
