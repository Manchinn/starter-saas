// Per-user sequences: add userId, scope uniqueness to (code, userId), and drop
// the legacy global UNIQUE constraint on Sequences.code via table-recreation
// (SQLite cannot ALTER away a constraint). The recreation is idempotent — it
// only fires while a UNIQUE definition is still present.
async function dropLegacyUniqueOnCode(ctx) {
  const { sequelize } = ctx
  const [tableRows] = await sequelize.query(`SELECT sql FROM sqlite_master WHERE type='table' AND name='Sequences'`)
  const tableSql = tableRows[0]?.sql || ''
  const [indexRows] = await sequelize.query(`SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name='Sequences' AND sql IS NOT NULL`)
  const hasUniqueIndex  = indexRows.some((r) => r.sql && /UNIQUE/i.test(r.sql))
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
  } catch (err) {
    await sequelize.query('ROLLBACK')
    throw err
  }
}

module.exports = {
  async up(ctx) {
    await ctx.addColumn('Sequences', 'userId', { type: ctx.DataTypes.TEXT })
    if (ctx.sequelize.getDialect() === 'sqlite') await dropLegacyUniqueOnCode(ctx)
    await ctx.addIndex('Sequences', ['code', 'userId'], { name: 'idx_sequences_code_user', unique: true })
  },
  // The legacy global-unique constraint is intentionally not restored on down
  // (it conflicts with the per-user design); only the additive changes reverse.
  async down(ctx) {
    await ctx.removeIndex('Sequences', 'idx_sequences_code_user')
    await ctx.removeColumn('Sequences', 'userId')
  },
}
