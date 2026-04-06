const { Sequelize } = require('sequelize')
const config = require('./config')
const path = require('path')
const fs = require('fs')

const storageDir = path.dirname(path.resolve(config.db.storage))
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true })
}

const sequelize = new Sequelize({
  dialect: config.db.dialect,
  storage: path.resolve(config.db.storage),
  logging: config.db.logging,
})

module.exports = sequelize
