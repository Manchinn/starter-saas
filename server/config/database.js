const { Sequelize } = require('sequelize')
const path = require('path')
const fs = require('fs')
const config = require('./config')

const DEFAULT_PORTS = {
  postgres: 5432,
  mysql:    3306,
  mariadb:  3306,
  mssql:    1433,
}

/**
 * Build a Sequelize instance from a config object shaped like config.db.
 * Exported separately so install-time endpoints can spin up a *temporary*
 * connection to validate user-supplied credentials without touching the
 * live process-wide instance.
 */
function buildSequelize(dbCfg) {
  const dialect = dbCfg.dialect || 'sqlite'

  if (dialect === 'sqlite') {
    const storagePath = path.resolve(dbCfg.storage || './data/database.sqlite')
    const storageDir  = path.dirname(storagePath)
    if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true })
    return new Sequelize({
      dialect: 'sqlite',
      storage: storagePath,
      logging: dbCfg.logging,
    })
  }

  return new Sequelize(dbCfg.database, dbCfg.username, dbCfg.password, {
    host:     dbCfg.host || 'localhost',
    port:     dbCfg.port || DEFAULT_PORTS[dialect],
    dialect,
    logging:  dbCfg.logging,
    dialectOptions: dialect === 'mssql'
      ? { options: { encrypt: false, trustServerCertificate: true } }
      : {},
    pool: { max: 10, min: 0, idle: 10000 },
  })
}

const sequelize = buildSequelize(config.db)
sequelize.buildSequelize = buildSequelize

module.exports = sequelize
