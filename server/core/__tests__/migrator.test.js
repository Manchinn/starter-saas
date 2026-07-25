const { Sequelize } = require('sequelize')
const { quotedTrackingTable, quotedTrackingColumn } = require('../migrator')

describe('migration tracker quoting', () => {
  test('preserves the mixed-case tracker name on PostgreSQL', () => {
    const sequelize = new Sequelize('postgres://user:pass@localhost:5432/saas', {
      dialect: 'postgres',
      logging: false,
    })
    expect(quotedTrackingTable(sequelize)).toBe('"SchemaMigrations"')
    expect(quotedTrackingColumn(sequelize, 'appliedAt')).toBe('"appliedAt"')
    return sequelize.close()
  })

  test('uses the SQLite identifier style for local development', () => {
    const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false })
    expect(quotedTrackingTable(sequelize)).toBe('`SchemaMigrations`')
    return sequelize.close()
  })
})
