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

  // ProductCategory — code field
  `ALTER TABLE ProductCategories ADD COLUMN code TEXT`,

  // Customer — group association
  `ALTER TABLE Customers ADD COLUMN customerGroupId TEXT`,

  // Pricing — customer group association
  `ALTER TABLE Pricings ADD COLUMN customerGroupId TEXT`,

  // GoodReceiveItem — stock qty after UOM conversion
  `ALTER TABLE GoodReceiveItems ADD COLUMN stockQty REAL DEFAULT 0`,

  // UOMConversion — scope per user (createdBy)
  `ALTER TABLE UOMConversions ADD COLUMN createdBy TEXT`,

  // Sequence — scope per user
  `ALTER TABLE Sequences ADD COLUMN userId TEXT`,

  // Pricing — code field
  `ALTER TABLE Pricings ADD COLUMN code TEXT`,

  // User — default landing page after login (role user only)
  `ALTER TABLE Users ADD COLUMN defaultPage TEXT`,

  // Pricing — sale item link
  `ALTER TABLE Pricings ADD COLUMN saleItemId TEXT`,

  // SalesOrderItem — sale item and store links
  `ALTER TABLE sales_order_items ADD COLUMN saleItemId TEXT`,
  `ALTER TABLE sales_order_items ADD COLUMN storeId TEXT`,

  // Per-user scoping — createdBy on master data tables
  `ALTER TABLE Stores ADD COLUMN createdBy TEXT`,
  `ALTER TABLE UOMs ADD COLUMN createdBy TEXT`,
  `ALTER TABLE Vendors ADD COLUMN createdBy TEXT`,
  `ALTER TABLE Vendors ADD COLUMN vendorTypes TEXT`,
  `ALTER TABLE ProductCategories ADD COLUMN createdBy TEXT`,
  `ALTER TABLE Products ADD COLUMN createdBy TEXT`,
  `ALTER TABLE Pricings ADD COLUMN createdBy TEXT`,

  // Organization-scoped code uniqueness — add organizationId to master data tables
  `ALTER TABLE Customers ADD COLUMN organizationId TEXT`,
  `ALTER TABLE sale_items ADD COLUMN organizationId TEXT`,
  `ALTER TABLE Pricings ADD COLUMN organizationId TEXT`,
  `ALTER TABLE Vendors ADD COLUMN organizationId TEXT`,
  `ALTER TABLE Stores ADD COLUMN organizationId TEXT`,
  `ALTER TABLE ProductCategories ADD COLUMN organizationId TEXT`,

  // ── Audit fields: createdBy + modifiedBy on all main tables ─────────────────
  // createdBy: some tables already have it — duplicates silently ignored
  `ALTER TABLE Customers          ADD COLUMN createdBy  TEXT`,
  `ALTER TABLE Customers          ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE CustomerGroups     ADD COLUMN createdBy  TEXT`,
  `ALTER TABLE CustomerGroups     ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE quotations         ADD COLUMN createdBy  TEXT`,
  `ALTER TABLE quotations         ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE quotation_items    ADD COLUMN createdBy  TEXT`,
  `ALTER TABLE quotation_items    ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE Orders             ADD COLUMN createdBy  TEXT`,
  `ALTER TABLE Orders             ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE sales_order_items  ADD COLUMN createdBy  TEXT`,
  `ALTER TABLE sales_order_items  ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE Invoices           ADD COLUMN createdBy  TEXT`,
  `ALTER TABLE Invoices           ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE invoice_items      ADD COLUMN createdBy  TEXT`,
  `ALTER TABLE invoice_items      ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE Receipts           ADD COLUMN createdBy  TEXT`,
  `ALTER TABLE Receipts           ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE GoodReceives       ADD COLUMN createdBy  TEXT`,
  `ALTER TABLE GoodReceives       ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE StockAdjusts       ADD COLUMN createdBy  TEXT`,
  `ALTER TABLE StockAdjusts       ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE StockCounts        ADD COLUMN createdBy  TEXT`,
  `ALTER TABLE StockCounts        ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE StockIssues        ADD COLUMN createdBy  TEXT`,
  `ALTER TABLE StockIssues        ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE StockRequests      ADD COLUMN createdBy  TEXT`,
  `ALTER TABLE StockRequests      ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE StockReturns       ADD COLUMN createdBy  TEXT`,
  `ALTER TABLE StockReturns       ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE MasterDataCategories ADD COLUMN createdBy  TEXT`,
  `ALTER TABLE MasterDataCategories ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE MasterDataValues   ADD COLUMN createdBy  TEXT`,
  `ALTER TABLE MasterDataValues   ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE Vendors            ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE Stores             ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE UOMs               ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE UOMConversions     ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE Products           ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE ProductCategories  ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE sale_items         ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE Pricings           ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE Employees          ADD COLUMN modifiedBy TEXT`,
  `ALTER TABLE Departments        ADD COLUMN modifiedBy TEXT`,

  // Unique indexes: code must be unique per organization (NULLs are treated as distinct in SQLite)
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_code_org      ON Customers        (code, organizationId)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_sale_items_code_org     ON sale_items        (code, organizationId)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_pricings_code_org       ON Pricings          (code, organizationId)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_code_org        ON Vendors           (code, organizationId)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_code_org         ON Stores            (code, organizationId)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_code_org     ON ProductCategories (code, organizationId)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_code_org    ON Departments       (code, organizationId)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_sequences_code_user     ON Sequences         (code, userId)`,

  // ── dataFlag: soft-delete flag (0=inactive, 1=active, 2=deleted) ──────────────
  `ALTER TABLE Customers             ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE CustomerGroups        ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE quotations            ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE quotation_items       ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE Orders                ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE sales_order_items     ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE Invoices              ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE invoice_items         ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE Receipts              ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE GoodReceives          ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE GoodReceiveItems      ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE StockAdjusts          ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE StockAdjustItems      ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE StockCounts           ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE StockCountItems       ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE StockIssues           ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE StockIssueItems       ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE StockRequests         ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE StockRequestItems     ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE StockReturns          ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE StockReturnItems      ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE MasterDataCategories  ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE MasterDataValues      ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE Vendors               ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE Stores                ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE UOMs                  ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE UOMConversions        ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE Products              ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE ProductCategories     ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE sale_items            ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE Pricings              ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE Employees             ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE Departments           ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE StockMovements        ADD COLUMN dataFlag INTEGER DEFAULT 1`,
  `ALTER TABLE Items                 ADD COLUMN dataFlag INTEGER DEFAULT 1`,

  // ── Organization parent-child hierarchy ──────────────────────────────────────
  `ALTER TABLE Users ADD COLUMN parentId TEXT`,

  // ── activeFrom / activeTo — validity period on all master-data tables ─────────
  `ALTER TABLE Customers          ADD COLUMN activeFrom TEXT`,
  `ALTER TABLE Customers          ADD COLUMN activeTo   TEXT`,
  `ALTER TABLE CustomerGroups     ADD COLUMN activeFrom TEXT`,
  `ALTER TABLE CustomerGroups     ADD COLUMN activeTo   TEXT`,
  `ALTER TABLE Vendors            ADD COLUMN activeFrom TEXT`,
  `ALTER TABLE Vendors            ADD COLUMN activeTo   TEXT`,
  `ALTER TABLE Stores             ADD COLUMN activeFrom TEXT`,
  `ALTER TABLE Stores             ADD COLUMN activeTo   TEXT`,
  `ALTER TABLE UOMs               ADD COLUMN activeFrom TEXT`,
  `ALTER TABLE UOMs               ADD COLUMN activeTo   TEXT`,
  `ALTER TABLE Products           ADD COLUMN activeFrom TEXT`,
  `ALTER TABLE Products           ADD COLUMN activeTo   TEXT`,
  `ALTER TABLE ProductCategories  ADD COLUMN activeFrom TEXT`,
  `ALTER TABLE ProductCategories  ADD COLUMN activeTo   TEXT`,
  `ALTER TABLE Pricings           ADD COLUMN activeFrom TEXT`,
  `ALTER TABLE Pricings           ADD COLUMN activeTo   TEXT`,
  `ALTER TABLE Departments        ADD COLUMN activeFrom TEXT`,
  `ALTER TABLE Departments        ADD COLUMN activeTo   TEXT`,
  `ALTER TABLE Employees          ADD COLUMN activeFrom TEXT`,
  `ALTER TABLE Employees          ADD COLUMN activeTo   TEXT`,

  // ── organizationId — added to all remaining ERP entity tables ────────────────
  `ALTER TABLE CustomerGroups        ADD COLUMN organizationId TEXT`,
  `ALTER TABLE UOMs                  ADD COLUMN organizationId TEXT`,
  `ALTER TABLE UOMConversions        ADD COLUMN organizationId TEXT`,
  `ALTER TABLE Products              ADD COLUMN organizationId TEXT`,
  `ALTER TABLE quotations            ADD COLUMN organizationId TEXT`,
  `ALTER TABLE quotation_items       ADD COLUMN organizationId TEXT`,
  `ALTER TABLE Orders                ADD COLUMN organizationId TEXT`,
  `ALTER TABLE sales_order_items     ADD COLUMN organizationId TEXT`,
  `ALTER TABLE Invoices              ADD COLUMN organizationId TEXT`,
  `ALTER TABLE invoice_items         ADD COLUMN organizationId TEXT`,
  `ALTER TABLE Receipts              ADD COLUMN organizationId TEXT`,
  `ALTER TABLE GoodReceives          ADD COLUMN organizationId TEXT`,
  `ALTER TABLE GoodReceiveItems      ADD COLUMN organizationId TEXT`,
  `ALTER TABLE StockAdjusts          ADD COLUMN organizationId TEXT`,
  `ALTER TABLE StockAdjustItems      ADD COLUMN organizationId TEXT`,
  `ALTER TABLE StockCounts           ADD COLUMN organizationId TEXT`,
  `ALTER TABLE StockCountItems       ADD COLUMN organizationId TEXT`,
  `ALTER TABLE StockIssues           ADD COLUMN organizationId TEXT`,
  `ALTER TABLE StockIssueItems       ADD COLUMN organizationId TEXT`,
  `ALTER TABLE StockRequests         ADD COLUMN organizationId TEXT`,
  `ALTER TABLE StockRequestItems     ADD COLUMN organizationId TEXT`,
  `ALTER TABLE StockReturns          ADD COLUMN organizationId TEXT`,
  `ALTER TABLE StockReturnItems      ADD COLUMN organizationId TEXT`,
  `ALTER TABLE MasterDataCategories  ADD COLUMN organizationId TEXT`,
  `ALTER TABLE MasterDataValues      ADD COLUMN organizationId TEXT`,
  `ALTER TABLE StockMovements        ADD COLUMN organizationId TEXT`,
  `ALTER TABLE Items                 ADD COLUMN organizationId TEXT`,
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
  await recreateSequencesTable(sequelize)
  console.log('[Migrations] Done.')
}

// ── Remove UNIQUE constraint on Sequences.code (SQLite table-recreation) ──────
async function recreateSequencesTable(sequelize) {
  try {
    // Check both inline UNIQUE in table SQL and separate UNIQUE INDEX entries
    const [tableRows] = await sequelize.query(`SELECT sql FROM sqlite_master WHERE type='table' AND name='Sequences'`)
    const tableSql = tableRows[0]?.sql || ''
    const [indexRows] = await sequelize.query(`SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name='Sequences' AND sql IS NOT NULL`)
    const hasUniqueIndex = indexRows.some(r => r.sql && /UNIQUE/i.test(r.sql))
    const hasInlineUnique = /UNIQUE/i.test(tableSql)
    if (!hasUniqueIndex && !hasInlineUnique) return // already clean

    await sequelize.query('BEGIN')
    try {
      await sequelize.query(`
        CREATE TABLE Sequences_new (
          id           TEXT     PRIMARY KEY,
          code         TEXT     NOT NULL,
          userId       TEXT,
          name         TEXT     NOT NULL,
          initialValue INTEGER  NOT NULL DEFAULT 1,
          runningValue INTEGER  NOT NULL DEFAULT 1,
          reseedPeriod TEXT     NOT NULL DEFAULT 'F',
          lastResetDate TEXT,
          maxValue     INTEGER  NOT NULL DEFAULT 99999,
          format       TEXT     NOT NULL DEFAULT '{####}',
          createdAt    DATETIME NOT NULL,
          updatedAt    DATETIME NOT NULL
        )
      `)
      await sequelize.query(`INSERT INTO Sequences_new SELECT id, code, userId, name, initialValue, runningValue, reseedPeriod, lastResetDate, maxValue, format, createdAt, updatedAt FROM Sequences`)
      await sequelize.query(`DROP TABLE Sequences`)
      await sequelize.query(`ALTER TABLE Sequences_new RENAME TO Sequences`)
      await sequelize.query('COMMIT')
      console.log('[Migration] Recreated Sequences table — removed UNIQUE constraint on code.')
    } catch (err) {
      await sequelize.query('ROLLBACK')
      throw err
    }
  } catch (err) {
    console.error('[Migration] recreateSequencesTable failed:', err.message)
  }
}

// ── Sequence number seed data ─────────────────────────────────────────────────
const SEQUENCE_SEEDS = [
  { code: 'GR',  name: 'Good Receive',     format: 'GR{YY}{MM}{####}',  initialValue: 1, runningValue: 1, reseedPeriod: 'M', maxValue: 9999 },
  { code: 'ADJ', name: 'Stock Adjustment', format: 'ADJ{YY}{MM}{####}', initialValue: 1, runningValue: 1, reseedPeriod: 'M', maxValue: 9999 },
  { code: 'CNT', name: 'Stock Count',      format: 'SC{YY}{MM}{####}',  initialValue: 1, runningValue: 1, reseedPeriod: 'M', maxValue: 9999 },
  { code: 'STR', name: 'Stock Transfer',    format: 'RQ{YY}{MM}{####}',  initialValue: 1, runningValue: 1, reseedPeriod: 'M', maxValue: 9999 },
  { code: 'RTN', name: 'Stock Return',     format: 'RTN{YY}{MM}{####}', initialValue: 1, runningValue: 1, reseedPeriod: 'M', maxValue: 9999 },
  { code: 'ISS', name: 'Stock Issue',     format: 'ISS{YY}{MM}{####}', initialValue: 1, runningValue: 1, reseedPeriod: 'M', maxValue: 9999 },
  { code: 'DEP', name: 'Department Code', format: 'DEP{####}',         initialValue: 1, runningValue: 1, reseedPeriod: 'F', maxValue: 99999 },
]

async function seedSequences() {
  // Lazy-require to avoid circular deps at module load time
  const { Sequence, User } = require('./models')

  // Delete old global (userId: null) sequences — replaced by per-user ones
  await Sequence.destroy({ where: { userId: null } })

  // Seed defaults for every existing user
  const users = await User.findAll({ attributes: ['id'] })
  let total = 0
  for (const user of users) {
    const existing = await Sequence.count({ where: { userId: user.id } })
    if (existing > 0) continue
    for (const seed of SEQUENCE_SEEDS) {
      await Sequence.create({ ...seed, userId: user.id, runningValue: seed.initialValue })
    }
    total++
  }
  if (total > 0) console.log(`[Seed] Seeded sequences for ${total} user(s).`)
  else console.log('[Seed] Per-user sequences already present — skipped.')
}

module.exports = { runMigrations, seedSequences }
