const fs = require('fs')
const path = require('path')
const { Module: ModuleModel } = require('../models')

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
    const mod = require(modulePath)
    // Support both plain-object modules (defineModule) and legacy class modules
    const instance = typeof mod === 'function' ? new mod() : mod

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
    console.log(`[ModuleLoader] Loaded module: ${instance.slug}`)
  }

  console.log(`[ModuleLoader] ${loaded.size} modules loaded.`)
}

const get = (slug) => loaded.get(slug)
const getAll = () => Array.from(loaded.values())

module.exports = { loadAll, get, getAll }
