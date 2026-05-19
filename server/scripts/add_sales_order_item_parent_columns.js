require('dotenv').config()
const { sequelize } = require('../models')

async function migrate() {
  try {
    await sequelize.authenticate()
    console.log('[Migration] Database connected.')

    const queryInterface = sequelize.getQueryInterface()
    const table = await queryInterface.describeTable('sales_order_items')

    if (!table.salePackageId) {
      await queryInterface.addColumn('sales_order_items', 'salePackageId', {
        type: sequelize.Sequelize.UUID,
        allowNull: true,
      })
      console.log('[Migration] Added salePackageId.')
    }

    if (!table.parentItemId) {
      await queryInterface.addColumn('sales_order_items', 'parentItemId', {
        type: sequelize.Sequelize.UUID,
        allowNull: true,
      })
      console.log('[Migration] Added parentItemId.')
    }

    console.log('[Migration] Success.')
    process.exit(0)
  } catch (err) {
    console.error('[Migration] Failed:', err)
    process.exit(1)
  }
}

migrate()
