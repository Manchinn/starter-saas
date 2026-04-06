/**
 * Incremental column migrations for SQLite.
 * Each statement is tried individually; errors for existing columns are silently ignored.
 * Add new ALTER TABLE statements here as new fields are introduced.
 */

const columns = [
  // GoodReceiveItem — extended fields (v2)
  `ALTER TABLE GoodReceiveItems ADD COLUMN qtyUomId TEXT`,
  `ALTER TABLE GoodReceiveItems ADD COLUMN freeQty REAL DEFAULT 0`,
  `ALTER TABLE GoodReceiveItems ADD COLUMN freeQtyUomId TEXT`,
  `ALTER TABLE GoodReceiveItems ADD COLUMN batchId TEXT`,
  `ALTER TABLE GoodReceiveItems ADD COLUMN expiryDate TEXT`,
  `ALTER TABLE GoodReceiveItems ADD COLUMN discount REAL DEFAULT 0`,
  `ALTER TABLE GoodReceiveItems ADD COLUMN discountPct REAL DEFAULT 0`,
  `ALTER TABLE GoodReceiveItems ADD COLUMN netAmount REAL DEFAULT 0`,
  `ALTER TABLE GoodReceiveItems ADD COLUMN wac REAL DEFAULT 0`,
  `ALTER TABLE GoodReceiveItems ADD COLUMN comments TEXT`,

  // GoodReceive — document type fields
  `ALTER TABLE GoodReceives ADD COLUMN docType TEXT DEFAULT 'invoice'`,
  `ALTER TABLE GoodReceives ADD COLUMN invoiceNo TEXT`,
  `ALTER TABLE GoodReceives ADD COLUMN invoiceDate TEXT`,
  `ALTER TABLE GoodReceives ADD COLUMN deliveryNo TEXT`,
  `ALTER TABLE GoodReceives ADD COLUMN invoiceDiscount REAL DEFAULT 0`,
  `ALTER TABLE GoodReceives ADD COLUMN invoiceNetAmount REAL DEFAULT 0`,

  // RoleModule join table — added in role-module feature
  // (handled by sync() creating the table fresh if it doesn't exist)
]

async function runMigrations(sequelize) {
  for (const sql of columns) {
    try {
      await sequelize.query(sql)
    } catch (err) {
      // Ignore "duplicate column name" — column already exists
      if (!err.message?.includes('duplicate column') && !err.message?.includes('already exists')) {
        console.error(`[Migration] Failed: ${sql}\n  ${err.message}`)
      }
    }
  }
  console.log('[Migrations] Done.')
}

module.exports = { runMigrations }
