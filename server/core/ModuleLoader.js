const fs = require('fs')
const path = require('path')
const { Module: ModuleModel } = require('../models')

const MODULES_DIR = path.join(__dirname, '..', 'modules')

class ModuleLoader {
  constructor() {
    this.loaded = new Map()
  }

  /**
   * Discover all module directories, instantiate them, sync to DB, and register on app.
   */
  async loadAll(app) {
    const ROOT_SHARED_DIR = path.join(MODULES_DIR, '..', '..', 'shared')
    const searchPaths = [MODULES_DIR, ROOT_SHARED_DIR]
    
    const files = searchPaths.flatMap((dir) => {
      if (!fs.existsSync(dir)) return []
      return fs.readdirSync(dir, { recursive: true })
        .filter((f) => f.endsWith('.module.js'))
        .map((f) => path.join(dir, f))
    })

    for (const modulePath of files) {
      const ModuleClass = require(modulePath)
      const instance = new ModuleClass()
      this.loaded.set(instance.slug, instance)

      // Upsert module record in DB
      await ModuleModel.upsert({
        slug: instance.slug,
        name: instance.name,
        description: instance.description,
        icon: instance.icon,
        order: instance.order,
        isCore: instance.isCore,
        permissions: instance.permissions,
        meta: instance.meta,
      }, { conflictFields: ['slug'] })

      // Register routes on app
      instance.register(app)

      console.log(`[ModuleLoader] Loaded module: ${instance.slug}`)
    }

    console.log(`[ModuleLoader] ${this.loaded.size} modules loaded.`)
  }

  get(slug) {
    return this.loaded.get(slug)
  }

  getAll() {
    return Array.from(this.loaded.values())
  }
}

module.exports = new ModuleLoader()
