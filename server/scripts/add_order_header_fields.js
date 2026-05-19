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

    const qi   = sequelize.getQueryInterface()
    const S    = sequelize.Sequelize
    const have = await qi.describeTable('Orders').catch(() => qi.describeTable('orders'))

    // Find the real table name — Sequelize uses pluralized PascalCase by default
    // here ("Orders"), but allow either capitalization.
    const tableNames = await qi.showAllTables()
    const tableName  = tableNames.find(t => /^orders$/i.test(t)) || 'Orders'

    const columns = [
      ['referenceNumber',      { type: S.STRING, allowNull: true }],
      ['expectedDeliveryDate', { type: S.DATEONLY, allowNull: true }],
      ['paymentTerms',         { type: S.STRING(20), allowNull: true }],
      ['salespersonId',        { type: S.UUID, allowNull: true }],
      ['shippingAddress',      { type: S.TEXT, allowNull: true }],
      ['billingAddress',       { type: S.TEXT, allowNull: true }],
      ['discountType',         { type: S.STRING(10), allowNull: true }],
      ['discountValue',        { type: S.DECIMAL(10, 2), allowNull: false, defaultValue: 0 }],
      ['discountAmount',       { type: S.DECIMAL(10, 2), allowNull: false, defaultValue: 0 }],
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
