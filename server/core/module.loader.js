const fs = require('fs')
const path = require('path')
const { Module: ModuleModel } = require('../models')
const log = require('./logger').forLabel('module-loader')

const MODULES_DIR = path.join(__dirname, '..', 'modules')
const loaded = new Map()

const loadAll = async (app) => {
  const ROOT_SHARED_DIR = path.join(MODULES_DIR, '..', '..', 'shared')
  const searchPaths = [MODULES_DIR, ROOT_SHARED_DIR]

  const files = searchPaths.flatMap((dir) => {
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir, { recursive: true })
      .filter((f) => f.endsWith('.module.js'))
      .map((f) => path.join(dir, f))
  })

  for (const modulePath of files) {
    const instance = require(modulePath)

    loaded.set(instance.slug, instance)

    await ModuleModel.upsert({
      slug:        instance.slug,
      name:        instance.name,
      description: instance.description,
      icon:        instance.icon,
      order:       instance.order,
      isCore:      instance.isCore,
      permissions: instance.permissions,
      meta:        instance.meta,
    }, { conflictFields: ['slug'] })

    instance.register(app)
    log.debug(`Loaded module: ${instance.slug}`)
  }

  log.info(`${loaded.size} modules loaded`)
}

const get = (slug) => loaded.get(slug)
const getAll = () => Array.from(loaded.values())

module.exports = { loadAll, get, getAll }
