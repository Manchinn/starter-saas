const sequelize = require('../config/database')
const { DataTypes } = require('sequelize')
const queryInterface = sequelize.getQueryInterface()

async function migrate() {
  try {
    const tableInfo = await queryInterface.describeTable('StockCounts')
    if (!tableInfo.movementLocked) {
      console.log('Adding movementLocked column to StockCounts...')
      await queryInterface.addColumn('StockCounts', 'movementLocked', {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      })
      console.log('Successfully added column.')
    } else {
      console.log('Column movementLocked already exists.')
    }
  } catch (err) {
    console.error('Migration failed:', err)
  } finally {
    process.exit()
  }
}

migrate()
